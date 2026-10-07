create extension if not exists btree_gist;

create type public.booking_status as enum ('pending_payment','confirmed','completed','cancelled','no_show','expired');
create type public.payment_status as enum ('pending','paid','failed','cancelled','refunded');
create type public.exception_type as enum ('blocked','custom_hours');
create type public.enquiry_status as enum ('new','read','responded','archived');

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- admins
create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select on public.admins to authenticated;
grant all on public.admins to service_role;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
create policy "Admins read own row" on public.admins for select to authenticated using (user_id = auth.uid());

-- settings
create table public.booking_settings (
  id int primary key default 1 check (id = 1),
  timezone text not null default 'Africa/Johannesburg',
  buffer_minutes int not null default 15 check (buffer_minutes between 0 and 240),
  max_advance_days int not null default 42 check (max_advance_days between 1 and 365),
  min_notice_hours int not null default 12 check (min_notice_hours between 0 and 336),
  slot_interval_minutes int not null default 15 check (slot_interval_minutes between 5 and 120),
  hold_minutes int not null default 15 check (hold_minutes between 5 and 60),
  updated_at timestamptz not null default now()
);
insert into public.booking_settings (id) values (1);
grant select on public.booking_settings to anon, authenticated;
grant update on public.booking_settings to authenticated;
grant all on public.booking_settings to service_role;
alter table public.booking_settings enable row level security;
create policy "Anyone reads settings" on public.booking_settings for select using (true);
create policy "Admins update settings" on public.booking_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_settings_updated before update on public.booking_settings for each row execute function public.set_updated_at();

-- services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  short_description text not null default '',
  full_description text not null default '',
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 480),
  price_cents int not null check (price_cents > 0),
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.services to anon;
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "Public reads active services" on public.services for select using (active or public.is_admin());
create policy "Admins manage services" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_services_updated before update on public.services for each row execute function public.set_updated_at();

insert into public.services (name, slug, short_description, full_description, duration_minutes, price_cents, display_order) values
('General Football Consultation','general-football-consultation','Not sure which consultation you need? Start here.','A relaxed first conversation for players or parents who are unsure which consultation fits. We talk through your situation and point you to the right next step.',30,35000,1),
('Career Consultation','career-consultation','For players unsure what their next career step should be.','We look at your current football situation, career goals, club level and ambitions, then map out realistic pathways, areas for improvement and short- and long-term planning.',45,50000,2),
('International Career Consultation','international-career-consultation','For players exploring football opportunities outside South Africa.','We discuss international markets, your current playing level, club requirements, your football CV and highlight profile, trial and opportunity preparation, and practical next steps. This is guidance, not a guarantee of overseas opportunities.',45,65000,3),
('Career Decision Consultation','career-decision-consultation','For footballers facing an important career decision.','Received a club offer, recently released, weighing up multiple clubs, staying in South Africa versus going abroad, or considering signing with an agent? We work through the decision together.',45,50000,4),
('Player Assessment Consultation','player-assessment-consultation','A detailed review of where you stand as a player.','A thorough assessment of your playing history, position, playing level, strengths, development areas, career positioning, current opportunities and potential barriers.',60,85000,5);

-- availability
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
grant select, insert, update, delete on public.availability_rules to authenticated;
grant all on public.availability_rules to service_role;
alter table public.availability_rules enable row level security;
create policy "Admins manage rules" on public.availability_rules for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_rules_updated before update on public.availability_rules for each row execute function public.set_updated_at();
insert into public.availability_rules (weekday, start_time, end_time) values (1,'17:00','20:00'),(3,'17:00','20:00'),(6,'10:00','14:00');

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type public.exception_type not null,
  start_time time,
  end_time time,
  reason text check (reason is null or length(reason) <= 200),
  created_at timestamptz not null default now(),
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time)),
  check (type = 'blocked' or start_time is not null)
);
create index on public.availability_exceptions(date);
grant select, insert, update, delete on public.availability_exceptions to authenticated;
grant all on public.availability_exceptions to service_role;
alter table public.availability_exceptions enable row level security;
create policy "Admins manage exceptions" on public.availability_exceptions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  age int not null check (age between 6 and 100),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 255),
  whatsapp text not null check (whatsapp ~ '^\+?[0-9 ()-]{7,20}$'),
  position text check (position is null or length(position) <= 60),
  current_club text check (current_club is null or length(current_club) <= 120),
  previous_clubs text check (previous_clubs is null or length(previous_clubs) <= 500),
  playing_level text check (playing_level is null or length(playing_level) <= 80),
  country text not null default 'South Africa' check (length(country) <= 80),
  help_required text not null check (length(trim(help_required)) between 2 and 500),
  situation_description text check (situation_description is null or length(situation_description) <= 2000),
  social_profile text check (social_profile is null or length(social_profile) <= 300),
  highlight_video_url text check (highlight_video_url is null or highlight_video_url ~* '^https?://'),
  guardian_name text check (guardian_name is null or length(guardian_name) <= 120),
  guardian_email text check (guardian_email is null or guardian_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guardian_phone text check (guardian_phone is null or guardian_phone ~ '^\+?[0-9 ()-]{7,20}$'),
  guardian_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint minors_need_guardian check (age >= 18 or (guardian_name is not null and guardian_email is not null and guardian_phone is not null and guardian_consent))
);
create index on public.clients(email);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy "Admins manage clients" on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_clients_updated before update on public.clients for each row execute function public.set_updated_at();

-- bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  blocked_until timestamptz not null,
  timezone text not null default 'Africa/Johannesburg',
  status public.booking_status not null default 'pending_payment',
  hold_expires_at timestamptz,
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (blocked_until >= end_time),
  constraint no_overlapping_bookings exclude using gist (tstzrange(start_time, blocked_until) with &&)
    where (status in ('pending_payment','confirmed','completed'))
);
create index on public.bookings(start_time);
create index on public.bookings(status);
grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Admins manage bookings" on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_bookings_updated before update on public.bookings for each row execute function public.set_updated_at();

-- payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'payfast' check (provider in ('payfast','manual')),
  provider_payment_id text,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  status public.payment_status not null default 'pending',
  raw_reference jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.payments(booking_id);
create unique index payments_provider_ref_unique on public.payments(provider, provider_payment_id) where provider_payment_id is not null;
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "Admins manage payments" on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_payments_updated before update on public.payments for each row execute function public.set_updated_at();

-- players
create table public.represented_players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  image_url text,
  position text,
  age int check (age is null or age between 6 and 60),
  current_club text,
  previous_clubs text,
  nationality text,
  active boolean not null default true,
  visible boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.represented_players to anon;
grant select, insert, update, delete on public.represented_players to authenticated;
grant all on public.represented_players to service_role;
alter table public.represented_players enable row level security;
create policy "Public reads visible players" on public.represented_players for select using ((visible and active) or public.is_admin());
create policy "Admins manage players" on public.represented_players for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_players_updated before update on public.represented_players for each row execute function public.set_updated_at();

-- testimonials
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null check (length(trim(client_name)) between 1 and 120),
  role_or_context text,
  content text not null check (length(trim(content)) between 5 and 1500),
  approved boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
alter table public.testimonials enable row level security;
create policy "Public reads approved testimonials" on public.testimonials for select using (approved or public.is_admin());
create policy "Admins manage testimonials" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger trg_testimonials_updated before update on public.testimonials for each row execute function public.set_updated_at();

-- enquiries
create table public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 255),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{7,20}$'),
  subject text not null check (length(trim(subject)) between 2 and 150),
  message text not null check (length(trim(message)) between 5 and 3000),
  status public.enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);
grant insert on public.contact_enquiries to anon;
grant select, insert, update, delete on public.contact_enquiries to authenticated;
grant all on public.contact_enquiries to service_role;
alter table public.contact_enquiries enable row level security;
create policy "Anyone submits enquiry" on public.contact_enquiries for insert to anon, authenticated with check (status = 'new');
create policy "Admins manage enquiries" on public.contact_enquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ===== Booking engine =====
create or replace function public.get_available_slots(p_service_id uuid, p_date date)
returns setof timestamptz language plpgsql stable security definer set search_path = public as $$
declare
  cfg public.booking_settings; svc public.services; tz text; today date;
  win record; t timestamptz; slot_end timestamptz; dur interval; buf interval;
begin
  select * into cfg from public.booking_settings where id = 1;
  tz := cfg.timezone;
  select * into svc from public.services where id = p_service_id and active;
  if not found then return; end if;
  today := (now() at time zone tz)::date;
  if p_date < today or p_date > today + cfg.max_advance_days then return; end if;
  if exists (select 1 from public.availability_exceptions where date = p_date and type = 'blocked' and start_time is null) then return; end if;
  dur := make_interval(mins => svc.duration_minutes);
  buf := make_interval(mins => cfg.buffer_minutes);
  for win in
    select (p_date + e.start_time) at time zone tz as ws, (p_date + e.end_time) at time zone tz as we
      from public.availability_exceptions e where e.date = p_date and e.type = 'custom_hours'
    union all
    select (p_date + r.start_time) at time zone tz, (p_date + r.end_time) at time zone tz
      from public.availability_rules r
     where r.active and r.weekday = extract(dow from p_date)::int
       and not exists (select 1 from public.availability_exceptions e2 where e2.date = p_date and e2.type = 'custom_hours')
    order by 1
  loop
    t := win.ws;
    while t + dur <= win.we loop
      slot_end := t + dur;
      if t >= now() + make_interval(hours => cfg.min_notice_hours)
        and not exists (
          select 1 from public.availability_exceptions b
           where b.date = p_date and b.type = 'blocked' and b.start_time is not null
             and tstzrange((p_date + b.start_time) at time zone tz, (p_date + b.end_time) at time zone tz) && tstzrange(t, slot_end))
        and not exists (
          select 1 from public.bookings k
           where (k.status in ('confirmed','completed') or (k.status = 'pending_payment' and k.hold_expires_at > now()))
             and tstzrange(k.start_time, k.blocked_until) && tstzrange(t, slot_end + buf))
      then
        return next t;
      end if;
      t := t + make_interval(mins => cfg.slot_interval_minutes);
    end loop;
  end loop;
end; $$;

create or replace function public.get_available_dates(p_service_id uuid, p_from date, p_to date)
returns setof date language plpgsql stable security definer set search_path = public as $$
declare d date;
begin
  if p_to - p_from > 120 then p_to := p_from + 120; end if;
  d := p_from;
  while d <= p_to loop
    if exists (select 1 from public.get_available_slots(p_service_id, d)) then return next d; end if;
    d := d + 1;
  end loop;
end; $$;

create or replace function public.expire_stale_holds() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with x as (
    update public.bookings set status = 'expired'
     where status = 'pending_payment' and hold_expires_at < now() returning id)
  update public.payments p set status = 'cancelled' from x where p.booking_id = x.id and p.status = 'pending';
  get diagnostics n = row_count;
  return n;
end; $$;

create or replace function public.create_booking_hold(p_service_id uuid, p_start timestamptz, p_client jsonb)
returns table (booking_id uuid, booking_reference text, hold_expires_at timestamptz)
language plpgsql volatile security definer set search_path = public as $$
declare
  cfg public.booking_settings; svc public.services; v_client uuid; v_booking uuid; v_ref text; v_hold timestamptz;
  v_age int; v_end timestamptz;
  function_nullif text;
begin
  select * into cfg from public.booking_settings where id = 1;
  select * into svc from public.services where id = p_service_id and active;
  if not found then raise exception 'SERVICE_UNAVAILABLE' using errcode = 'P0001'; end if;

  perform public.expire_stale_holds();

  if not exists (select 1 from public.get_available_slots(p_service_id, (p_start at time zone cfg.timezone)::date) s where s = p_start) then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  v_age := (p_client->>'age')::int;
  if v_age < 18 and coalesce((p_client->>'guardian_consent')::boolean, false) is not true then
    raise exception 'GUARDIAN_CONSENT_REQUIRED' using errcode = 'P0001';
  end if;

  insert into public.clients (full_name, age, email, whatsapp, position, current_club, previous_clubs, playing_level, country,
    help_required, situation_description, social_profile, highlight_video_url, guardian_name, guardian_email, guardian_phone, guardian_consent)
  values (trim(p_client->>'full_name'), v_age, lower(trim(p_client->>'email')), trim(p_client->>'whatsapp'),
    nullif(trim(p_client->>'position'),''), nullif(trim(p_client->>'current_club'),''), nullif(trim(p_client->>'previous_clubs'),''),
    nullif(trim(p_client->>'playing_level'),''), coalesce(nullif(trim(p_client->>'country'),''),'South Africa'),
    trim(p_client->>'help_required'), nullif(trim(p_client->>'situation_description'),''), nullif(trim(p_client->>'social_profile'),''),
    nullif(trim(p_client->>'highlight_video_url'),''),
    case when v_age < 18 then nullif(trim(p_client->>'guardian_name'),'') end,
    case when v_age < 18 then nullif(lower(trim(p_client->>'guardian_email')),'') end,
    case when v_age < 18 then nullif(trim(p_client->>'guardian_phone'),'') end,
    case when v_age < 18 then coalesce((p_client->>'guardian_consent')::boolean,false) else false end)
  returning id into v_client;

  v_end := p_start + make_interval(mins => svc.duration_minutes);
  v_hold := now() + make_interval(mins => cfg.hold_minutes);
  v_ref := 'KM-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));

  begin
    insert into public.bookings (booking_reference, client_id, service_id, start_time, end_time, blocked_until, timezone, status, hold_expires_at)
    values (v_ref, v_client, svc.id, p_start, v_end, v_end + make_interval(mins => cfg.buffer_minutes), cfg.timezone, 'pending_payment', v_hold)
    returning id into v_booking;
  exception when exclusion_violation then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end;

  insert into public.payments (booking_id, provider, amount_cents, currency, status)
  values (v_booking, 'payfast', svc.price_cents, 'ZAR', 'pending');

  return query select v_booking, v_ref, v_hold;
end; $$;

create or replace function public.get_booking_public(p_booking_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', b.id, 'booking_reference', b.booking_reference, 'status', b.status,
    'start_time', b.start_time, 'end_time', b.end_time, 'timezone', b.timezone, 'hold_expires_at', b.hold_expires_at,
    'service_name', s.name, 'duration_minutes', s.duration_minutes, 'client_name', c.full_name,
    'amount_cents', p.amount_cents, 'payment_status', p.status)
  from public.bookings b
  join public.services s on s.id = b.service_id
  join public.clients c on c.id = b.client_id
  left join lateral (select * from public.payments where booking_id = b.id order by created_at desc limit 1) p on true
  where b.id = p_booking_id;
$$;

revoke execute on function public.expire_stale_holds() from public, anon;
grant execute on function public.expire_stale_holds() to authenticated, service_role;
grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;
grant execute on function public.get_available_dates(uuid, date, date) to anon, authenticated;
grant execute on function public.create_booking_hold(uuid, timestamptz, jsonb) to anon, authenticated;
grant execute on function public.get_booking_public(uuid) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- storage policies
create policy "Anyone views player photos" on storage.objects for select using (bucket_id = 'player-photos');
create policy "Admins upload player photos" on storage.objects for insert to authenticated with check (bucket_id = 'player-photos' and public.is_admin());
create policy "Admins update player photos" on storage.objects for update to authenticated using (bucket_id = 'player-photos' and public.is_admin());
create policy "Admins delete player photos" on storage.objects for delete to authenticated using (bucket_id = 'player-photos' and public.is_admin());