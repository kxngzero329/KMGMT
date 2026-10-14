create or replace function public.claim_booking_email_jobs(p_limit integer default 4)
returns setof public.booking_email_outbox
language plpgsql security definer set search_path = '' as $$
begin
  -- A queued confirmation must not go out after a cancellation or refund.
  update public.booking_email_outbox q set status = 'manual_review',
    last_error_code = 'booking_or_payment_changed', locked_until = null
    where (q.status = 'pending' or (q.status = 'processing' and q.locked_until <= now()))
      and exists (
        select 1 from public.bookings b join public.payments p on p.id = q.payment_id
        where b.id = q.booking_id and (
          p.status <> 'paid'
          or (q.kind in ('customer_confirmation','admin_confirmation') and b.status not in ('confirmed','completed'))
          or (q.kind = 'admin_payment_followup' and b.status in ('confirmed','completed'))
        )
      );
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
