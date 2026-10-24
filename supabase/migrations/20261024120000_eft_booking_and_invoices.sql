-- EFT reserves a slot while funds are verified manually. No bank details belong
-- in public tables, RPC results, or the website bundle.
alter table public.payments drop constraint payments_provider_check;
alter table public.payments add constraint payments_provider_check check (provider in ('payfast','manual','eft'));
alter table public.payments add column invoice_number text unique;
alter table public.payments add column invoice_issued_at timestamptz;
alter table public.payments add column verified_by uuid references auth.users(id);

create table public.eft_booking_requests (
  id uuid primary key,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  payload_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.eft_booking_requests enable row level security;
revoke all on public.eft_booking_requests from public, anon, authenticated;
grant all on public.eft_booking_requests to service_role;

create table public.eft_email_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  kind text not null check (kind in ('customer_invoice','admin_notification')),
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
  unique(payment_id,kind)
);
create index eft_email_due on public.eft_email_outbox(next_attempt_at) where status in ('pending','processing');
alter table public.eft_email_outbox enable row level security;
revoke all on public.eft_email_outbox from public, anon, authenticated;
grant all on public.eft_email_outbox to service_role;

create function public.dispatch_eft_email_worker()
returns void language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if not exists(select 1 from public.eft_email_outbox
    where (status='pending' and next_attempt_at<=now()) or (status='processing' and locked_until<=now())) then return; end if;
  select decrypted_secret into v_token from vault.decrypted_secrets where name='booking_email_worker_token' limit 1;
  if v_token is null then raise warning 'EFT email worker token is missing'; return; end if;
  perform net.http_post(
    url := 'https://thtjdoaiukjyxdculnpb.supabase.co/functions/v1/process-eft-emails',
    headers := jsonb_build_object('Content-Type','application/json','x-email-worker-token',v_token),
    body := '{}'::jsonb, timeout_milliseconds := 90000);
end;
$$;
revoke all on function public.dispatch_eft_email_worker() from public,anon,authenticated;
grant execute on function public.dispatch_eft_email_worker() to service_role;

create function public.create_eft_booking(p_service_id uuid,p_start timestamptz,p_client jsonb,p_request_id uuid)
returns table(booking_id uuid,booking_reference text,invoice_number text)
language plpgsql security definer set search_path = '' as $$
declare
  v_hold record; v_existing record; v_payment public.payments; v_snapshot jsonb;
  v_hash text := md5(jsonb_build_object('service',p_service_id,'start',p_start,'client',p_client)::text);
begin
  if p_request_id is null then raise exception 'INVALID_REQUEST'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('eft-request:'||p_request_id::text,0));
  select r.payload_hash,b.id,b.booking_reference,b.status,p.invoice_number into v_existing
    from public.eft_booking_requests r join public.bookings b on b.id=r.booking_id
    join public.payments p on p.booking_id=b.id and p.provider='eft' where r.id=p_request_id;
  if found then
    if v_existing.payload_hash<>v_hash then raise exception 'REQUEST_MISMATCH'; end if;
    if v_existing.status not in ('confirmed','completed') then raise exception 'EFT_BOOKING_CLOSED'; end if;
    return query select v_existing.id::uuid,v_existing.booking_reference::text,v_existing.invoice_number::text;
    return;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('eft-email:'||lower(trim(p_client->>'email')),0));
  if (select count(*) from public.bookings b join public.clients c on c.id=b.client_id
      join public.payments p on p.booking_id=b.id
      where lower(c.email)=lower(trim(p_client->>'email')) and b.status='confirmed'
        and p.provider='eft' and p.status='pending')>=3 then
    raise exception 'EFT_BOOKING_LIMIT';
  end if;
  -- The existing SQL engine checks availability, guardian consent, prices,
  -- session duration and the exclusion constraint. All work commits atomically.
  select * into strict v_hold from public.create_booking_hold(p_service_id,p_start,p_client,'online');
  update public.payments p set provider='eft',invoice_number='INV-'||v_hold.booking_reference,
    invoice_issued_at=now() where p.booking_id=v_hold.booking_id and p.status='pending'
    returning p.* into strict v_payment;
  -- A confirmed reservation with a pending payment is deliberate for EFT.
  -- This does not claim funds have been received and cannot trigger PayFast mail.
  update public.bookings set status='confirmed',hold_expires_at=null where id=v_hold.booking_id;
  insert into public.eft_booking_requests(id,booking_id,payload_hash) values(p_request_id,v_hold.booking_id,v_hash);
  select jsonb_build_object(
    'booking',jsonb_build_object('id',b.id,'reference',b.booking_reference,'start_time',b.start_time,
      'end_time',b.end_time,'timezone',b.timezone,'status',b.status,'notes',b.notes,'consultation_format',b.consultation_format),
    'payment',jsonb_build_object('id',v_payment.id,'provider','eft','status','pending','amount_cents',v_payment.amount_cents,
      'currency',v_payment.currency,'invoice_number',v_payment.invoice_number,'invoice_issued_at',v_payment.invoice_issued_at),
    'service',jsonb_build_object('name',s.name,'duration_minutes',s.duration_minutes),
    'client',to_jsonb(c)-'created_at'-'updated_at') into v_snapshot
    from public.bookings b join public.services s on s.id=b.service_id join public.clients c on c.id=b.client_id
    where b.id=v_hold.booking_id;
  insert into public.eft_email_outbox(booking_id,payment_id,kind,snapshot) values
    (v_hold.booking_id,v_payment.id,'customer_invoice',v_snapshot),
    (v_hold.booking_id,v_payment.id,'admin_notification',v_snapshot);
  begin perform public.dispatch_eft_email_worker();
  exception when others then raise warning 'EFT invoice queued for scheduled delivery'; end;
  return query select v_hold.booking_id::uuid,v_hold.booking_reference::text,v_payment.invoice_number;
end;
$$;
revoke all on function public.create_eft_booking(uuid,timestamptz,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.create_eft_booking(uuid,timestamptz,jsonb,uuid) to service_role;

create function public.claim_eft_email_jobs(p_limit integer default 2)
returns setof public.eft_email_outbox language plpgsql security definer set search_path = '' as $$
begin
  update public.eft_email_outbox q set status='manual_review',last_error_code='booking_or_payment_changed',locked_until=null
    where (q.status='pending' or (q.status='processing' and q.locked_until<=now()))
    and exists(select 1 from public.bookings b join public.payments p on p.id=q.payment_id
      where b.id=q.booking_id and (b.status not in ('confirmed','completed') or p.status<>'pending' or p.provider<>'eft'));
  update public.eft_email_outbox set status='manual_review',last_error_code='idempotency_window_expired',locked_until=null
    where status in ('pending','processing') and first_attempt_at<now()-interval '23 hours'
      and (locked_until is null or locked_until<=now());
  return query with due as (
    select id from public.eft_email_outbox where (status='pending' and next_attempt_at<=now())
      or (status='processing' and locked_until<=now()) order by created_at,id for update skip locked
      limit least(greatest(p_limit,1),2)
  ) update public.eft_email_outbox q set status='processing',attempts=attempts+1,
      first_attempt_at=coalesce(first_attempt_at,now()),locked_until=now()+interval '3 minutes',lock_token=gen_random_uuid()
    from due where q.id=due.id returning q.*;
end;
$$;
create function public.freeze_eft_email_request(p_id uuid,p_lock uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_payload jsonb;
begin
  update public.eft_email_outbox set request_payload=coalesce(request_payload,p_payload)
    where id=p_id and lock_token=p_lock and status='processing' returning request_payload into v_payload;
  if v_payload is null then raise exception 'EFT email lease lost'; end if;
  return v_payload;
end;
$$;
create function public.finish_eft_email_job(p_id uuid,p_lock uuid,p_resend_id text default null,
  p_error_code text default null,p_permanent boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (p_resend_id is null)=(p_error_code is null) then raise exception 'Invalid EFT email result'; end if;
  update public.eft_email_outbox set
    status=case when p_resend_id is not null then 'sent' when p_permanent then 'manual_review' else 'pending' end,
    resend_id=coalesce(p_resend_id,resend_id),sent_at=case when p_resend_id is not null then now() else sent_at end,
    last_error_code=p_error_code,locked_until=null,lock_token=null,
    next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,least(attempts,7)))::integer)
    where id=p_id and lock_token=p_lock and status='processing';
  if not found then raise exception 'EFT email lease lost'; end if;
end;
$$;
revoke all on function public.claim_eft_email_jobs(integer) from public,anon,authenticated;
revoke all on function public.freeze_eft_email_request(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.finish_eft_email_job(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.claim_eft_email_jobs(integer) to service_role;
grant execute on function public.freeze_eft_email_request(uuid,uuid,jsonb) to service_role;
grant execute on function public.finish_eft_email_job(uuid,uuid,text,text,boolean) to service_role;

create function public.verify_eft_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_payment public.payments; v_booking public.bookings;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into strict v_payment from public.payments where id=p_payment_id for update;
  if v_payment.provider<>'eft' then raise exception 'Only EFT payments can be verified manually'; end if;
  if v_payment.status='paid' then return; end if;
  if v_payment.status<>'pending' then raise exception 'Payment is not awaiting verification'; end if;
  select * into strict v_booking from public.bookings where id=v_payment.booking_id for update;
  if v_booking.status not in ('confirmed','completed') then raise exception 'Booking is no longer reserved'; end if;
  update public.payments set status='paid',paid_at=now(),verified_by=auth.uid(),
    provider_payment_id=invoice_number where id=p_payment_id;
end;
$$;
revoke all on function public.verify_eft_payment(uuid) from public,anon;
grant execute on function public.verify_eft_payment(uuid) to authenticated;

create or replace function public.get_booking_public(p_booking_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id',b.id,'booking_reference',b.booking_reference,'status',b.status,
    'start_time',b.start_time,'end_time',b.end_time,'timezone',b.timezone,
    'hold_expires_at',b.hold_expires_at,'consultation_format',b.consultation_format,
    'service_name',s.name,'duration_minutes',s.duration_minutes,'client_name',c.full_name,
    'amount_cents',p.amount_cents,'payment_status',p.status,'payment_provider',p.provider,'invoice_number',p.invoice_number)
  from public.bookings b join public.services s on s.id=b.service_id join public.clients c on c.id=b.client_id
  left join lateral(select * from public.payments where booking_id=b.id order by created_at desc limit 1) p on true
  where b.id=p_booking_id;
$$;
select cron.schedule('kmgmt-eft-email-retries','* * * * *','select public.dispatch_eft_email_worker();');
