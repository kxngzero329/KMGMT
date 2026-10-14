-- No backfill: only future verified payments/confirmations create email jobs.
create table public.booking_email_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  kind text not null check (kind in ('customer_confirmation','admin_confirmation','admin_payment_followup')),
  snapshot jsonb not null,
  request_payload jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','manual_review')),
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  lock_token uuid,
  resend_id text,
  last_error_code text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (payment_id, kind)
);
create index booking_email_due on public.booking_email_outbox(next_attempt_at)
  where status in ('pending','processing');
alter table public.booking_email_outbox enable row level security;
revoke all on public.booking_email_outbox from public, anon, authenticated;
grant all on public.booking_email_outbox to service_role;

-- The queue entry commits with the booking/payment update. Payment secrets and
-- PayFast's raw notification are deliberately excluded from the email snapshot.
create function public.enqueue_paid_booking_emails(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_payment public.payments;
  v_snapshot jsonb;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then return; end if;
  select * into v_payment from public.payments
    where booking_id = p_booking_id and status = 'paid' and provider = 'payfast'
      and provider_payment_id is not null and paid_at is not null
    order by paid_at desc, id limit 1;
  if not found then return; end if;
  select jsonb_build_object(
    'booking', jsonb_build_object('id', v_booking.id, 'reference', v_booking.booking_reference,
      'start_time', v_booking.start_time, 'end_time', v_booking.end_time,
      'timezone', v_booking.timezone, 'status', v_booking.status, 'notes', v_booking.notes),
    'payment', jsonb_build_object('id', v_payment.id, 'provider', v_payment.provider,
      'reference', v_payment.provider_payment_id, 'amount_cents', v_payment.amount_cents,
      'currency', v_payment.currency, 'paid_at', v_payment.paid_at),
    'service', jsonb_build_object('name', s.name, 'duration_minutes', s.duration_minutes),
    'client', to_jsonb(c) - 'created_at' - 'updated_at'
  ) into v_snapshot from public.clients c join public.services s on s.id = v_booking.service_id
    where c.id = v_booking.client_id;
  if v_snapshot is null then raise exception 'Missing email booking details'; end if;
  if v_booking.status = 'confirmed' then
    insert into public.booking_email_outbox(booking_id,payment_id,kind,snapshot)
      values (p_booking_id,v_payment.id,'customer_confirmation',v_snapshot),
             (p_booking_id,v_payment.id,'admin_confirmation',v_snapshot)
      on conflict (payment_id,kind) do nothing;
  elsif v_booking.notes like 'PAID AFTER HOLD EXPIRED:%' then
    insert into public.booking_email_outbox(booking_id,payment_id,kind,snapshot)
      values (p_booking_id,v_payment.id,'admin_payment_followup',v_snapshot)
      on conflict (payment_id,kind) do nothing;
  end if;
end;
$$;
revoke all on function public.enqueue_paid_booking_emails(uuid) from public, anon, authenticated;
grant execute on function public.enqueue_paid_booking_emails(uuid) to service_role;

create function public.queue_paid_booking_email_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_TABLE_NAME = 'bookings' then
    perform public.enqueue_paid_booking_emails(new.id);
  else
    perform public.enqueue_paid_booking_emails(new.booking_id);
  end if;
  return new;
end;
$$;
revoke all on function public.queue_paid_booking_email_trigger() from public, anon, authenticated;
create trigger booking_confirmation_emails after update of status, notes on public.bookings
  for each row execute function public.queue_paid_booking_email_trigger();
create trigger paid_booking_emails after update of status on public.payments
  for each row when (new.status = 'paid') execute function public.queue_paid_booking_email_trigger();

create function public.claim_booking_email_jobs(p_limit integer default 4)
returns setof public.booking_email_outbox
language plpgsql security definer set search_path = '' as $$
begin
  -- Resend retains idempotency keys for 24h. Never blindly resend an ambiguous
  -- request outside that window; retain it for reconciliation instead.
  update public.booking_email_outbox set status = 'manual_review',
    last_error_code = 'idempotency_window_expired', locked_until = null
    where status in ('pending','processing') and first_attempt_at < now() - interval '23 hours'
      and (locked_until is null or locked_until <= now());
  return query
    with due as (
      select id from public.booking_email_outbox
      where (status = 'pending' and next_attempt_at <= now())
         or (status = 'processing' and locked_until <= now())
      order by created_at, id for update skip locked limit least(greatest(p_limit,1),4)
    )
    update public.booking_email_outbox q set status = 'processing', attempts = attempts + 1,
      first_attempt_at = coalesce(first_attempt_at, now()),
      locked_until = now() + interval '3 minutes', lock_token = gen_random_uuid()
    from due where q.id = due.id returning q.*;
end;
$$;

create function public.freeze_booking_email_request(p_id uuid, p_lock uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_payload jsonb;
begin
  update public.booking_email_outbox set request_payload = coalesce(request_payload,p_payload)
    where id = p_id and lock_token = p_lock and status = 'processing'
    returning request_payload into v_payload;
  if v_payload is null then raise exception 'Email lease lost'; end if;
  return v_payload;
end;
$$;

create function public.finish_booking_email_job(p_id uuid, p_lock uuid,
  p_resend_id text default null, p_error_code text default null, p_permanent boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (p_resend_id is null) = (p_error_code is null) then raise exception 'Invalid email result'; end if;
  update public.booking_email_outbox set
    status = case when p_resend_id is not null then 'sent' when p_permanent then 'manual_review' else 'pending' end,
    resend_id = coalesce(p_resend_id,resend_id),
    sent_at = case when p_resend_id is not null then now() else sent_at end,
    last_error_code = p_error_code, locked_until = null, lock_token = null,
    next_attempt_at = now() + make_interval(secs => least(3600,30 * power(2,least(attempts,7)))::integer)
    where id = p_id and lock_token = p_lock and status = 'processing';
  if not found then raise exception 'Email lease lost'; end if;
end;
$$;
revoke all on function public.claim_booking_email_jobs(integer) from public, anon, authenticated;
revoke all on function public.freeze_booking_email_request(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.finish_booking_email_job(uuid,uuid,text,text,boolean) from public, anon, authenticated;
grant execute on function public.claim_booking_email_jobs(integer) to service_role;
grant execute on function public.freeze_booking_email_request(uuid,uuid,jsonb) to service_role;
grant execute on function public.finish_booking_email_job(uuid,uuid,text,text,boolean) to service_role;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- The worker token is installed separately in Vault and Edge Function secrets.
-- Neither the token nor any email credential is embedded in the cron command.
create function public.dispatch_booking_email_worker()
returns void language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if not exists(select 1 from public.booking_email_outbox
    where (status = 'pending' and next_attempt_at <= now())
       or (status = 'processing' and locked_until <= now())) then return; end if;
  select decrypted_secret into v_token from vault.decrypted_secrets
    where name = 'booking_email_worker_token' limit 1;
  if v_token is null then raise warning 'Booking email worker token is missing'; return; end if;
  perform net.http_post(
    url := 'https://thtjdoaiukjyxdculnpb.supabase.co/functions/v1/process-booking-emails',
    headers := jsonb_build_object('Content-Type','application/json','x-email-worker-token',v_token),
    body := '{}'::jsonb, timeout_milliseconds := 90000
  );
end;
$$;
revoke all on function public.dispatch_booking_email_worker() from public, anon, authenticated;
grant execute on function public.dispatch_booking_email_worker() to service_role;
select cron.schedule('kmgmt-booking-email-retries','* * * * *',
  'select public.dispatch_booking_email_worker();');
