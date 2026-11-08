begin;

-- Visitor reviews publish immediately. Legacy curated testimonials are unchanged.
create table public.reviews (
  id uuid primary key,
  client_name text not null check (length(btrim(client_name)) between 2 and 80),
  role_or_context text check (length(role_or_context) <= 100),
  rating smallint not null check (rating between 1 and 5),
  content text not null check (length(btrim(content)) between 10 and 1500),
  created_at timestamptz not null default now()
);
create index reviews_newest on public.reviews (created_at desc, id desc);
alter table public.reviews enable row level security;
revoke all on public.reviews from public, anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant all on public.reviews to service_role;
create policy "Anyone reads published reviews" on public.reviews for select using (true);

create table public.review_replies (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  content text not null check (length(btrim(content)) between 2 and 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.review_replies enable row level security;
revoke all on public.review_replies from public, anon, authenticated;
grant select on public.review_replies to anon;
grant select, insert, update, delete on public.review_replies to authenticated;
grant all on public.review_replies to service_role;
create policy "Anyone reads KMGMT replies" on public.review_replies for select using (true);
create policy "Admins write KMGMT replies" on public.review_replies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create trigger trg_review_replies_updated before update on public.review_replies
  for each row execute function public.set_updated_at();

-- Private, short-lived abuse counters and retry receipts. Never store raw IPs.
create table public.review_submission_limits (
  key text primary key,
  submissions integer not null default 0,
  expires_at timestamptz not null
);
create index review_limits_expiry on public.review_submission_limits(expires_at);
create table public.review_submission_receipts (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  network_hash text not null,
  fingerprint text not null,
  expires_at timestamptz not null
);
create index review_receipts_expiry on public.review_submission_receipts(expires_at);
create index review_receipts_fingerprint on public.review_submission_receipts(fingerprint);
alter table public.review_submission_limits enable row level security;
alter table public.review_submission_receipts enable row level security;
revoke all on public.review_submission_limits, public.review_submission_receipts from public, anon, authenticated;
grant all on public.review_submission_limits, public.review_submission_receipts to service_role;

-- Atomic rate limits + idempotent retries; only the Edge Function may execute.
create function public.submit_public_review(
  p_id uuid, p_network_hash text, p_fingerprint text,
  p_client_name text, p_role_or_context text, p_rating integer, p_content text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_existing uuid;
  v_network text;
  v_count integer;
  v_key text;
  v_now timestamptz := now();
begin
  if p_id is null or p_network_hash !~ '^[0-9a-f]{64}$' or p_network_hash is null
     or p_fingerprint !~ '^[0-9a-f]{64}$' or p_fingerprint is null then
    raise exception 'REVIEW_INVALID';
  end if;
  -- All requests share this short transaction lock, so counters and deduplication
  -- remain correct even when a visitor retries concurrently from multiple tabs.
  perform pg_catalog.pg_advisory_xact_lock(20261108, 120000);
  delete from public.review_submission_receipts where expires_at <= v_now;
  delete from public.review_submission_limits where expires_at <= v_now;
  select review_id, network_hash into v_existing, v_network
    from public.review_submission_receipts where review_id = p_id;
  if v_existing is not null then
    if v_network <> p_network_hash then raise exception 'REVIEW_CONFLICT'; end if;
    return v_existing;
  end if;
  if exists (select 1 from public.reviews where id = p_id) then
    raise exception 'REVIEW_CONFLICT';
  end if;
  if exists (select 1 from public.review_submission_receipts where fingerprint = p_fingerprint) then
    raise exception 'REVIEW_DUPLICATE';
  end if;
  -- A rolling 24-hour network quota, plus a global hourly cap independent of headers.
  v_key := 'network:' || p_network_hash;
  insert into public.review_submission_limits(key, expires_at)
    values(v_key, v_now + interval '24 hours') on conflict do nothing;
  update public.review_submission_limits set submissions = submissions + 1
    where key = v_key returning submissions into v_count;
  if v_count > 3 then raise exception 'REVIEW_RATE_LIMIT'; end if;
  insert into public.review_submission_limits(key, expires_at)
    values('global', v_now + interval '1 hour') on conflict do nothing;
  update public.review_submission_limits set submissions = submissions + 1
    where key = 'global' returning submissions into v_count;
  if v_count > 60 then raise exception 'REVIEW_RATE_LIMIT'; end if;

  insert into public.reviews(id, client_name, role_or_context, rating, content)
    values(p_id, btrim(p_client_name), nullif(btrim(p_role_or_context), ''), p_rating, btrim(p_content));
  insert into public.review_submission_receipts(review_id, network_hash, fingerprint, expires_at)
    values(p_id, p_network_hash, p_fingerprint, v_now + interval '24 hours');
  return p_id;
end;
$$;
revoke all on function public.submit_public_review(uuid,text,text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.submit_public_review(uuid,text,text,text,text,integer,text) to service_role;

-- Clear expired anti-spam data even when there are no new submissions.
select cron.schedule('cleanup-review-submissions', '17 * * * *', $job$
  delete from public.review_submission_receipts where expires_at <= now();
  delete from public.review_submission_limits where expires_at <= now();
$job$);

commit;
