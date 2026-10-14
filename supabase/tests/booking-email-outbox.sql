-- Integration assertions run in a rolled-back transaction. No real email/booking persists.
begin;
do $$
declare
  v_client uuid := gen_random_uuid(); v_service uuid := gen_random_uuid();
  v_booking uuid := gen_random_uuid(); v_payment uuid := gen_random_uuid();
  v_job public.booking_email_outbox; v_payload jsonb;
begin
  insert into public.clients(id,full_name,age,email,whatsapp,country,help_required)
    values(v_client,'Email integration test',25,'test@example.com','+27820000000','South Africa','Test');
  insert into public.services(id,name,slug,duration_minutes,price_cents,active)
    values(v_service,'Email integration test','email-test-' || v_service::text,60,50000,false);
  insert into public.bookings(id,booking_reference,client_id,service_id,start_time,end_time,blocked_until,status)
    values(v_booking,'EMAIL-TEST-' || v_booking::text,v_client,v_service,
      '2090-01-01T08:00:00Z','2090-01-01T09:00:00Z','2090-01-01T09:15:00Z','pending_payment');
  insert into public.payments(id,booking_id,amount_cents) values(v_payment,v_booking,50000);
  update public.bookings set status = 'confirmed' where id = v_booking;
  if exists(select 1 from public.booking_email_outbox where booking_id=v_booking) then
    raise exception 'Unpaid confirmation queued an email'; end if;
  update public.bookings set status = 'pending_payment' where id=v_booking;
  update public.payments set status='paid', paid_at=now(), provider_payment_id='email-test-' || v_payment::text where id=v_payment;
  if exists(select 1 from public.booking_email_outbox where booking_id=v_booking) then
    raise exception 'Pending booking queued confirmation'; end if;
  update public.bookings set status='confirmed' where id=v_booking;
  perform public.enqueue_paid_booking_emails(v_booking);
  if (select count(*) from public.booking_email_outbox where booking_id=v_booking) <> 2 then
    raise exception 'Expected exactly one customer and one admin job'; end if;
  if exists(select 1 from public.booking_email_outbox where booking_id=v_booking and snapshot::text like '%raw_reference%') then
    raise exception 'Raw notification leaked into email snapshot'; end if;
  if has_table_privilege('anon','public.booking_email_outbox','SELECT')
    or has_function_privilege('anon','public.claim_booking_email_jobs(integer)','EXECUTE')
    or has_function_privilege('authenticated','public.enqueue_paid_booking_emails(uuid)','EXECUTE') then
    raise exception 'Email queue exposed to public callers'; end if;

  -- Isolate the test jobs so claims never change existing live delivery records.
  update public.booking_email_outbox set next_attempt_at=now()-interval '1 day' where booking_id=v_booking;
  select * into v_job from public.claim_booking_email_jobs(1) where booking_id=v_booking;
  if v_job.id is null then raise exception 'Unable to claim email'; end if;
  if v_job.attempts <> 1 or v_job.lock_token is null then raise exception 'Missing lease'; end if;
  v_payload := public.freeze_booking_email_request(v_job.id,v_job.lock_token,'{"subject":"original"}');
  if public.freeze_booking_email_request(v_job.id,v_job.lock_token,'{"subject":"changed"}') <> v_payload then
    raise exception 'Retry email payload changed'; end if;
  perform public.finish_booking_email_job(v_job.id,v_job.lock_token,'resend-test-id');
  if (select status from public.booking_email_outbox where id=v_job.id) <> 'sent' then
    raise exception 'Receipt was not saved'; end if;
  update public.booking_email_outbox set first_attempt_at=now()-interval '25 hours' where booking_id=v_booking and status='pending';
  perform public.claim_booking_email_jobs(1);
  if exists(select 1 from public.booking_email_outbox where booking_id=v_booking and status not in ('sent','manual_review')) then
    raise exception 'Expired idempotency window was retried'; end if;
  update public.bookings set status='expired',notes='PAID AFTER HOLD EXPIRED: test conflict' where id=v_booking;
  if (select count(*) from public.booking_email_outbox where booking_id=v_booking and kind='admin_payment_followup') <> 1 then
    raise exception 'Missing paid conflict alert'; end if;
  update public.payments set status='refunded' where id=v_payment;
  perform public.claim_booking_email_jobs(4);
  if exists(select 1 from public.booking_email_outbox where booking_id=v_booking and status in ('pending','processing')) then
    raise exception 'Refunded payment can still send an email'; end if;
end;
$$;
rollback;
