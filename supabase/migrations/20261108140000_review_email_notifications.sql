begin;

-- Contact addresses never live in publicly readable review/reply rows.
create table public.review_contacts (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  created_at timestamptz not null default now()
);
alter table public.review_contacts enable row level security;
revoke all on public.review_contacts from public, anon, authenticated;
grant all on public.review_contacts to service_role;
-- The dashboard may learn whether a contact exists, but cannot fetch the email.
grant select(review_id) on public.review_contacts to authenticated;
create policy "Admins see review notification availability" on public.review_contacts
  for select to authenticated using (public.is_admin());

create table public.review_email_outbox (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  kind text not null check (kind in ('admin_review','reviewer_reply')),
  snapshot jsonb not null,
  request_payload jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','manual_review','cancelled')),
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
create unique index review_email_admin_once on public.review_email_outbox(review_id) where kind = 'admin_review';
create index review_email_due on public.review_email_outbox(next_attempt_at) where status in ('pending','processing');
alter table public.review_email_outbox enable row level security;
revoke all on public.review_email_outbox from public, anon, authenticated;
grant all on public.review_email_outbox to service_role;

-- Independent worker/schedule: booking, payment and contact delivery are unchanged.
create function public.dispatch_review_email_worker()
returns void language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if not exists(select 1 from public.review_email_outbox
    where (status = 'pending' and next_attempt_at <= now())
       or (status = 'processing' and locked_until <= now())) then return; end if;
  select decrypted_secret into v_token from vault.decrypted_secrets
    where name = 'booking_email_worker_token' limit 1;
  if v_token is null then raise warning 'Review email worker token is missing'; return; end if;
  perform net.http_post(
    url := 'https://thtjdoaiukjyxdculnpb.supabase.co/functions/v1/process-review-emails',
    headers := jsonb_build_object('Content-Type','application/json','x-email-worker-token',v_token),
    body := '{}'::jsonb, timeout_milliseconds := 90000
  );
end;
$$;
revoke all on function public.dispatch_review_email_worker() from public, anon, authenticated;
grant execute on function public.dispatch_review_email_worker() to service_role;

create function public.queue_review_admin_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.review_email_outbox(review_id,kind,snapshot)
    select r.id, 'admin_review', jsonb_build_object('review',to_jsonb(r),'email',new.email)
    from public.reviews r where r.id = new.review_id;
  begin perform public.dispatch_review_email_worker();
  exception when others then raise warning 'Review notification queued for scheduled delivery'; end;
  return new;
end;
$$;
revoke all on function public.queue_review_admin_email() from public, anon, authenticated;
create trigger review_admin_notification after insert on public.review_contacts
  for each row execute function public.queue_review_admin_email();

create function public.queue_review_reply_email()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_review_id uuid;
begin
  if tg_op = 'UPDATE' then
    if new.content is not distinct from old.content then return new; end if;
  end if;
  v_review_id := case when tg_op = 'DELETE' then old.review_id else new.review_id end;
  -- Replace unsent notifications if the reply is edited/removed before delivery.
  update public.review_email_outbox set status = 'cancelled', last_error_code = 'reply_superseded'
    where review_id = v_review_id and kind = 'reviewer_reply' and status = 'pending';
  if tg_op = 'DELETE' then return old; end if;
  insert into public.review_email_outbox(review_id,kind,snapshot)
    select r.id, 'reviewer_reply', jsonb_build_object(
      'review',to_jsonb(r), 'email',c.email,
      'reply',jsonb_build_object('content',new.content,'updated_at',new.updated_at))
    from public.reviews r join public.review_contacts c on c.review_id = r.id
    where r.id = new.review_id;
  if found then
    begin perform public.dispatch_review_email_worker();
    exception when others then raise warning 'Review reply notification queued for scheduled delivery'; end;
  end if;
  return new;
end;
$$;
revoke all on function public.queue_review_reply_email() from public, anon, authenticated;
create trigger review_reply_notification after insert or update or delete on public.review_replies
  for each row execute function public.queue_review_reply_email();

-- Wrap the existing atomic submission with mandatory private contact storage.
-- The old RPC stays service-only for a safe rolling Edge Function deployment.
create function public.submit_public_review_with_email(
  p_id uuid, p_network_hash text, p_fingerprint text,
  p_client_name text, p_role_or_context text, p_rating integer, p_content text,
  p_email text, p_email_hash text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_exists boolean; v_email text; v_count integer;
begin
  if p_email is null or length(p_email) > 254
    or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_email_hash is null or p_email_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'REVIEW_EMAIL_INVALID';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(20261108, 120000);
  select exists(select 1 from public.reviews where id = p_id) into v_exists;
  if v_exists and not exists(select 1 from public.review_contacts where review_id = p_id) then
    -- Never attach a caller's address to a historical public review.
    raise exception 'REVIEW_CONFLICT';
  end if;
  v_id := public.submit_public_review(p_id,p_network_hash,p_fingerprint,
    p_client_name,p_role_or_context,p_rating,p_content);
  if v_exists then
    select email into v_email from public.review_contacts where review_id = v_id;
    if v_email is distinct from lower(btrim(p_email)) then raise exception 'REVIEW_CONFLICT'; end if;
    return v_id;
  end if;
  -- A private address quota supplements the existing network/global limits.
  insert into public.review_submission_limits(key,expires_at)
    values('email:' || p_email_hash,now() + interval '24 hours') on conflict do nothing;
  update public.review_submission_limits set submissions = submissions + 1
    where key = 'email:' || p_email_hash returning submissions into v_count;
  if v_count > 3 then raise exception 'REVIEW_RATE_LIMIT'; end if;
  insert into public.review_contacts(review_id,email) values(v_id,lower(btrim(p_email)));
  return v_id;
end;
$$;
revoke all on function public.submit_public_review_with_email(uuid,text,text,text,text,integer,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_public_review_with_email(uuid,text,text,text,text,integer,text,text,text) to service_role;

create function public.claim_review_email_jobs(p_limit integer default 4)
returns setof public.review_email_outbox
language plpgsql security definer set search_path = '' as $$
begin
  update public.review_email_outbox q set status = 'cancelled',
    last_error_code = 'reply_superseded', locked_until = null, lock_token = null
    where kind = 'reviewer_reply'
      and (status = 'pending' or (status = 'processing' and locked_until <= now()))
      and not exists(select 1 from public.review_replies r
        where r.review_id = q.review_id and r.content = q.snapshot->'reply'->>'content');
  update public.review_email_outbox set status = 'manual_review',
    last_error_code = 'idempotency_window_expired', locked_until = null, lock_token = null
    where status in ('pending','processing') and first_attempt_at < now() - interval '23 hours'
      and (locked_until is null or locked_until <= now());
  return query
    with due as (
      select id from public.review_email_outbox
      where (status = 'pending' and next_attempt_at <= now())
         or (status = 'processing' and locked_until <= now())
      order by created_at,id for update skip locked limit least(greatest(p_limit,1),4)
    )
    update public.review_email_outbox q set status = 'processing', attempts = attempts + 1,
      first_attempt_at = coalesce(first_attempt_at,now()),
      locked_until = now() + interval '3 minutes', lock_token = gen_random_uuid()
    from due where q.id = due.id returning q.*;
end;
$$;

create function public.freeze_review_email_request(p_id uuid,p_lock uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_payload jsonb;
begin
  update public.review_email_outbox set request_payload = coalesce(request_payload,p_payload)
    where id = p_id and lock_token = p_lock and status = 'processing'
    returning request_payload into v_payload;
  if v_payload is null then raise exception 'Review email lease lost'; end if;
  return v_payload;
end;
$$;

create function public.finish_review_email_job(p_id uuid,p_lock uuid,
  p_resend_id text default null,p_error_code text default null,p_permanent boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (p_resend_id is null) = (p_error_code is null) then raise exception 'Invalid review email result'; end if;
  update public.review_email_outbox set
    status = case when p_resend_id is not null then 'sent' when p_permanent then 'manual_review' else 'pending' end,
    resend_id = coalesce(p_resend_id,resend_id),
    sent_at = case when p_resend_id is not null then now() else sent_at end,
    last_error_code = p_error_code, locked_until = null, lock_token = null,
    next_attempt_at = now() + make_interval(secs => least(3600,30 * power(2,least(attempts,7)))::integer)
    where id = p_id and lock_token = p_lock and status = 'processing';
  if not found then raise exception 'Review email lease lost'; end if;
end;
$$;
revoke all on function public.claim_review_email_jobs(integer) from public,anon,authenticated;
revoke all on function public.freeze_review_email_request(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.finish_review_email_job(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.claim_review_email_jobs(integer) to service_role;
grant execute on function public.freeze_review_email_request(uuid,uuid,jsonb) to service_role;
grant execute on function public.finish_review_email_job(uuid,uuid,text,text,boolean) to service_role;

select cron.schedule('kmgmt-review-email-retries','* * * * *','select public.dispatch_review_email_worker();');

commit;
