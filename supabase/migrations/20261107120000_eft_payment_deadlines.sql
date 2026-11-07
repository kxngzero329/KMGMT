-- New EFT reservations only. Existing invoices retain their original terms.
begin;
alter table public.payments add column due_at timestamptz;
alter table public.bookings add column cancellation_reason text;
create index eft_unpaid_deadlines on public.payments(due_at)
  where provider='eft' and status='pending' and due_at is not null;

create function public.set_eft_payment_deadline()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings;
begin
  if new.provider='eft' and (tg_op='INSERT' or old.provider is distinct from 'eft') then
    select * into strict v_booking from public.bookings where id=new.booking_id;
    new.due_at := least(v_booking.created_at+interval '72 hours',v_booking.start_time);
  end if;
  return new;
end;
$$;
revoke all on function public.set_eft_payment_deadline() from public,anon,authenticated;
create trigger set_eft_payment_deadline before insert or update of provider on public.payments
  for each row execute function public.set_eft_payment_deadline();

-- A snapshot is private, includes the server-assigned deadline, and freezes
-- when its first Resend request is built. Never change an attempted payload.
create function public.eft_email_snapshot(p_payment_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'booking',jsonb_build_object('id',b.id,'reference',b.booking_reference,
      'start_time',b.start_time,'end_time',b.end_time,'timezone',b.timezone,
      'status',b.status,'notes',b.notes,'consultation_format',b.consultation_format,
      'cancellation_reason',b.cancellation_reason),
    'payment',jsonb_build_object('id',p.id,'provider',p.provider,'status',p.status,
      'amount_cents',p.amount_cents,'currency',p.currency,'invoice_number',p.invoice_number,
      'invoice_issued_at',p.invoice_issued_at,'due_at',p.due_at),
    'service',jsonb_build_object('name',s.name,'duration_minutes',s.duration_minutes),
    'client',to_jsonb(c)-'created_at'-'updated_at')
  from public.payments p join public.bookings b on b.id=p.booking_id
    join public.services s on s.id=b.service_id join public.clients c on c.id=b.client_id
  where p.id=p_payment_id and p.provider='eft';
$$;
revoke all on function public.eft_email_snapshot(uuid) from public,anon,authenticated;
grant execute on function public.eft_email_snapshot(uuid) to service_role;

create function public.snapshot_eft_email_deadline()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.snapshot := public.eft_email_snapshot(new.payment_id);
  if new.snapshot is null then raise exception 'Missing EFT invoice details'; end if;
  return new;
end;
$$;
revoke all on function public.snapshot_eft_email_deadline() from public,anon,authenticated;
create trigger snapshot_eft_email_deadline before insert on public.eft_email_outbox
  for each row execute function public.snapshot_eft_email_deadline();

alter table public.eft_email_outbox drop constraint eft_email_outbox_kind_check;
alter table public.eft_email_outbox add constraint eft_email_outbox_kind_check check
  (kind in ('customer_invoice','admin_notification','customer_cancellation','admin_cancellation'));

-- Lock booking then payment, the same order as manual EFT verification.
-- Neither a paid payment nor a historical reservation with no deadline expires.
create function public.expire_unpaid_eft_bookings()
returns integer language plpgsql security definer set search_path='' as $$
declare v_booking public.bookings; v_payment public.payments; v_count integer:=0;
begin
  for v_booking in
    select b.* from public.bookings b where b.status='confirmed'
      and exists(select 1 from public.payments p where p.booking_id=b.id
        and p.provider='eft' and p.status='pending' and p.due_at<=clock_timestamp())
    order by b.id for update of b skip locked limit 100
  loop
    select * into v_payment from public.payments p where p.booking_id=v_booking.id
      and p.provider='eft' and p.status='pending' and p.due_at<=clock_timestamp()
      order by p.created_at desc limit 1 for update;
    if not found then continue; end if;
    if exists(select 1 from public.payments where booking_id=v_booking.id and status='paid') then continue; end if;
    update public.bookings set status='cancelled',cancellation_reason='eft_payment_overdue'
      where id=v_booking.id;
    update public.payments set status='cancelled' where id=v_payment.id and status='pending';
    update public.eft_email_outbox set status='manual_review',last_error_code='eft_payment_overdue',
      locked_until=null,lock_token=null where payment_id=v_payment.id
      and kind in ('customer_invoice','admin_notification')
      and (status='pending' or (status='processing' and locked_until<=now()));
    insert into public.eft_email_outbox(booking_id,payment_id,kind,snapshot) values
      (v_booking.id,v_payment.id,'customer_cancellation','{}'::jsonb),
      (v_booking.id,v_payment.id,'admin_cancellation','{}'::jsonb)
      on conflict(payment_id,kind) do nothing;
    v_count:=v_count+1;
  end loop;
  if v_count>0 then
    begin perform public.dispatch_eft_email_worker();
    exception when others then raise warning 'EFT cancellations queued for scheduled email delivery'; end;
  end if;
  return v_count;
end;
$$;
revoke all on function public.expire_unpaid_eft_bookings() from public,anon,authenticated;
grant execute on function public.expire_unpaid_eft_bookings() to service_role;

create or replace function public.verify_eft_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_payment public.payments; v_booking public.bookings; v_booking_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select booking_id into strict v_booking_id from public.payments where id=p_payment_id;
  select * into strict v_booking from public.bookings where id=v_booking_id for update;
  select * into strict v_payment from public.payments where id=p_payment_id for update;
  if v_payment.provider<>'eft' then raise exception 'Only EFT payments can be verified manually'; end if;
  if v_payment.status='paid' then return; end if;
  if v_payment.due_at<=clock_timestamp() then raise exception 'EFT_DEADLINE_PASSED'; end if;
  if v_payment.status<>'pending' then raise exception 'Payment is not awaiting verification'; end if;
  if v_booking.status not in ('confirmed','completed') then raise exception 'Booking is no longer reserved'; end if;
  update public.payments set status='paid',paid_at=clock_timestamp(),verified_by=auth.uid(),
    provider_payment_id=invoice_number where id=p_payment_id;
end;
$$;

create function public.guard_overdue_eft_booking()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='completed' and exists(select 1 from public.payments
    where booking_id=new.id and provider='eft' and status<>'paid' and due_at is not null) then
    raise exception 'EFT_PAYMENT_REQUIRED';
  end if;
  if new.status in ('confirmed','completed') and exists(
    select 1 from public.payments where booking_id=new.id and provider='eft'
      and status<>'paid' and due_at<=clock_timestamp()) then
    raise exception 'EFT_DEADLINE_PASSED';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_overdue_eft_booking() from public,anon,authenticated;
create trigger guard_overdue_eft_booking before update of status on public.bookings
  for each row execute function public.guard_overdue_eft_booking();

create or replace function public.claim_eft_email_jobs(p_limit integer default 2)
returns setof public.eft_email_outbox language plpgsql security definer set search_path='' as $$
begin
  update public.eft_email_outbox q set status='manual_review',last_error_code='booking_or_payment_changed',locked_until=null
    where (q.status='pending' or (q.status='processing' and q.locked_until<=now()))
    and not exists(select 1 from public.bookings b join public.payments p on p.id=q.payment_id
      where b.id=q.booking_id and p.provider='eft' and (
        (q.kind in ('customer_invoice','admin_notification') and b.status in ('confirmed','completed')
          and p.status='pending' and (p.due_at is null or p.due_at>clock_timestamp()))
        or (q.kind in ('customer_cancellation','admin_cancellation') and b.status='cancelled'
          and b.cancellation_reason='eft_payment_overdue' and p.status='cancelled')));
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

create or replace function public.get_booking_public(p_booking_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id',b.id,'booking_reference',b.booking_reference,'status',b.status,
    'start_time',b.start_time,'end_time',b.end_time,'timezone',b.timezone,
    'hold_expires_at',b.hold_expires_at,'consultation_format',b.consultation_format,
    'cancellation_reason',b.cancellation_reason,
    'service_name',s.name,'duration_minutes',s.duration_minutes,'client_name',c.full_name,
    'amount_cents',p.amount_cents,'payment_status',p.status,'payment_provider',p.provider,
    'invoice_number',p.invoice_number,'payment_due_at',p.due_at)
  from public.bookings b join public.services s on s.id=b.service_id join public.clients c on c.id=b.client_id
  left join lateral(select * from public.payments where booking_id=b.id order by created_at desc limit 1) p on true
  where b.id=p_booking_id;
$$;

select cron.schedule('kmgmt-expire-unpaid-eft','* * * * *','select public.expire_unpaid_eft_bookings();');
commit;
