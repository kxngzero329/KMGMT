-- Future contact submissions queue an admin email in the same transaction.
-- Existing enquiries are intentionally not emailed again.
create table public.contact_email_outbox (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null unique references public.contact_enquiries(id) on delete cascade,
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
  sent_at timestamptz
);
create index contact_email_due on public.contact_email_outbox(next_attempt_at)
  where status in ('pending','processing');
create index contact_email_sender on public.contact_email_outbox((lower(snapshot->>'email')), created_at);
alter table public.contact_email_outbox enable row level security;
revoke all on public.contact_email_outbox from public, anon, authenticated;
grant all on public.contact_email_outbox to service_role;

create function public.claim_contact_email_jobs(p_limit integer default 4)
returns setof public.contact_email_outbox
language plpgsql security definer set search_path = '' as $$
begin
  update public.contact_email_outbox set status = 'manual_review',
    last_error_code = 'idempotency_window_expired', locked_until = null
    where status in ('pending','processing') and first_attempt_at < now() - interval '23 hours'
      and (locked_until is null or locked_until <= now());
  return query
    with due as (
      select id from public.contact_email_outbox
      where (status = 'pending' and next_attempt_at <= now())
         or (status = 'processing' and locked_until <= now())
      order by created_at, id for update skip locked limit least(greatest(p_limit,1),4)
    )
    update public.contact_email_outbox q set status = 'processing', attempts = attempts + 1,
      first_attempt_at = coalesce(first_attempt_at, now()),
      locked_until = now() + interval '3 minutes', lock_token = gen_random_uuid()
    from due where q.id = due.id returning q.*;
end;
$$;

create function public.freeze_contact_email_request(p_id uuid, p_lock uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_payload jsonb;
begin
  update public.contact_email_outbox set request_payload = coalesce(request_payload,p_payload)
    where id = p_id and lock_token = p_lock and status = 'processing'
    returning request_payload into v_payload;
  if v_payload is null then raise exception 'Contact email lease lost'; end if;
  return v_payload;
end;
$$;

create function public.finish_contact_email_job(p_id uuid, p_lock uuid,
  p_resend_id text default null, p_error_code text default null, p_permanent boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (p_resend_id is null) = (p_error_code is null) then raise exception 'Invalid contact email result'; end if;
  update public.contact_email_outbox set
    status = case when p_resend_id is not null then 'sent' when p_permanent then 'manual_review' else 'pending' end,
    resend_id = coalesce(p_resend_id,resend_id),
    sent_at = case when p_resend_id is not null then now() else sent_at end,
    last_error_code = p_error_code, locked_until = null, lock_token = null,
    next_attempt_at = now() + make_interval(secs => least(3600,30 * power(2,least(attempts,7)))::integer)
    where id = p_id and lock_token = p_lock and status = 'processing';
  if not found then raise exception 'Contact email lease lost'; end if;
end;
$$;
revoke all on function public.claim_contact_email_jobs(integer) from public, anon, authenticated;
revoke all on function public.freeze_contact_email_request(uuid,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.finish_contact_email_job(uuid,uuid,text,text,boolean) from public, anon, authenticated;
grant execute on function public.claim_contact_email_jobs(integer) to service_role;
grant execute on function public.freeze_contact_email_request(uuid,uuid,jsonb) to service_role;
grant execute on function public.finish_contact_email_job(uuid,uuid,text,text,boolean) to service_role;

-- Reuse the existing private Edge worker, Vault token and every-minute schedule.
create or replace function public.dispatch_booking_email_worker()
returns void language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if not exists(select 1 from public.booking_email_outbox
    where (status = 'pending' and next_attempt_at <= now())
       or (status = 'processing' and locked_until <= now()))
    and not exists(select 1 from public.contact_email_outbox
      where (status = 'pending' and next_attempt_at <= now())
         or (status = 'processing' and locked_until <= now())) then return; end if;
  select decrypted_secret into v_token from vault.decrypted_secrets
    where name = 'booking_email_worker_token' limit 1;
  if v_token is null then raise warning 'Email worker token is missing'; return; end if;
  perform net.http_post(
    url := 'https://thtjdoaiukjyxdculnpb.supabase.co/functions/v1/process-booking-emails',
    headers := jsonb_build_object('Content-Type','application/json','x-email-worker-token',v_token),
    body := '{}'::jsonb, timeout_milliseconds := 90000
  );
end;
$$;

create function public.queue_contact_enquiry_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Bound repeated submissions from one address, including concurrent requests.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('kmgmt-contact:' || lower(trim(new.email)),0));
  if (select count(*) from public.contact_email_outbox
      where lower(snapshot->>'email') = lower(trim(new.email))
        and created_at > now() - interval '15 minutes') >= 5 then
    raise exception 'ENQUIRY_RATE_LIMIT' using errcode = 'P0001';
  end if;
  insert into public.contact_email_outbox(enquiry_id,snapshot)
    values(new.id, jsonb_build_object(
      'id', new.id, 'name', trim(new.name), 'email', lower(trim(new.email)),
      'phone', new.phone, 'subject', trim(new.subject), 'message', trim(new.message), 'created_at', now()))
    on conflict (enquiry_id) do nothing;
  begin
    perform public.dispatch_booking_email_worker();
  exception when others then
    -- Preserve the saved enquiry/job if an immediate nudge is unavailable.
    raise warning 'Contact notification queued for scheduled delivery';
  end;
  return new;
end;
$$;
revoke all on function public.queue_contact_enquiry_email() from public, anon, authenticated;
create trigger contact_enquiry_admin_email after insert on public.contact_enquiries
  for each row when (new.status = 'new') execute function public.queue_contact_enquiry_email();
