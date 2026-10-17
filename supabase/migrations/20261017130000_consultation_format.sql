-- Keep historical bookings unspecified; require an explicit choice for the new flow.
alter table public.bookings add column consultation_format text
  check (consultation_format in ('online', 'in_person'));

-- Retain the existing three-argument RPC for already-deployed clients. This
-- overload delegates slot/guardian/payment logic and saves the format atomically.
create function public.create_booking_hold(
  p_service_id uuid, p_start timestamptz, p_client jsonb, p_consultation_format text
)
returns table (booking_id uuid, booking_reference text, hold_expires_at timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
declare v_hold record;
begin
  if p_consultation_format is null or p_consultation_format not in ('online', 'in_person') then
    raise exception 'INVALID_CONSULTATION_FORMAT' using errcode = 'P0001';
  end if;
  select * into v_hold from public.create_booking_hold(p_service_id, p_start, p_client);
  update public.bookings set consultation_format = p_consultation_format
    where id = v_hold.booking_id;
  return query select v_hold.booking_id::uuid, v_hold.booking_reference::text,
    v_hold.hold_expires_at::timestamptz;
end;
$$;
revoke all on function public.create_booking_hold(uuid,timestamptz,jsonb,text) from public;
grant execute on function public.create_booking_hold(uuid,timestamptz,jsonb,text) to anon, authenticated, service_role;

create or replace function public.get_booking_public(p_booking_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', b.id, 'booking_reference', b.booking_reference, 'status', b.status,
    'start_time', b.start_time, 'end_time', b.end_time, 'timezone', b.timezone,
    'hold_expires_at', b.hold_expires_at, 'consultation_format', b.consultation_format,
    'service_name', s.name, 'duration_minutes', s.duration_minutes, 'client_name', c.full_name,
    'amount_cents', p.amount_cents, 'payment_status', p.status)
  from public.bookings b
  join public.services s on s.id = b.service_id
  join public.clients c on c.id = b.client_id
  left join lateral (select * from public.payments where booking_id = b.id order by created_at desc limit 1) p on true
  where b.id = p_booking_id;
$$;

-- Include the chosen meeting format in both customer/admin email snapshots.
-- Existing queued payloads remain unchanged to preserve delivery idempotency.
create or replace function public.enqueue_paid_booking_emails(p_booking_id uuid)
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
      'timezone', v_booking.timezone, 'status', v_booking.status, 'notes', v_booking.notes,
      'consultation_format', v_booking.consultation_format),
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
