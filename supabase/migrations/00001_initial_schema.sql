-- ============================================================
-- MMM Event OS — Initial Schema
-- ============================================================

-- Custom types
create type public.user_role as enum ('admin', 'member');
create type public.event_status as enum ('draft', 'published', 'cancelled');
create type public.ride_difficulty as enum ('easy', 'moderate', 'hard');

-- ============================================================
-- ORGS
-- ============================================================
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  primary_color text not null default '#000000',
  secondary_color text not null default '#ffffff',
  created_at timestamptz not null default now()
);

alter table public.orgs enable row level security;

-- Anyone can read orgs (needed for org resolution)
create policy "orgs_select" on public.orgs
  for select using (true);

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid not null references public.orgs on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read profiles in their own org
create policy "profiles_select_own_org" on public.profiles
  for select using (
    org_id in (select org_id from public.profiles where id = auth.uid())
  );

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Service role can insert (via trigger)
create policy "profiles_insert_service" on public.profiles
  for insert with check (true);

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs on delete cascade,
  title text not null,
  description text,
  date timestamptz not null,
  location text,
  image_url text,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Published events are public; drafts visible to org members
create policy "events_select" on public.events
  for select using (
    status = 'published'
    or org_id in (select org_id from public.profiles where id = auth.uid())
  );

-- Only org admins can insert/update/delete events
create policy "events_insert" on public.events
  for insert with check (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "events_update" on public.events
  for update using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "events_delete" on public.events
  for delete using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- RIDE SERIES
-- ============================================================
create table public.ride_series (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs on delete cascade,
  title text not null,
  description text,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sun
  time time not null,
  location text,
  difficulty public.ride_difficulty not null default 'moderate',
  created_at timestamptz not null default now()
);

alter table public.ride_series enable row level security;

create policy "ride_series_select" on public.ride_series
  for select using (true);

create policy "ride_series_insert" on public.ride_series
  for insert with check (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "ride_series_update" on public.ride_series
  for update using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- RIDE OCCURRENCES
-- ============================================================
create table public.ride_occurrences (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.ride_series on delete cascade,
  org_id uuid not null references public.orgs on delete cascade,
  date date not null,
  cancelled boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

alter table public.ride_occurrences enable row level security;

create policy "ride_occurrences_select" on public.ride_occurrences
  for select using (true);

create policy "ride_occurrences_insert" on public.ride_occurrences
  for insert with check (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "ride_occurrences_update" on public.ride_occurrences
  for update using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- CHECKINS
-- ============================================================
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  event_id uuid references public.events on delete set null,
  ride_occurrence_id uuid references public.ride_occurrences on delete set null,
  photo_path text,
  created_at timestamptz not null default now()
);

alter table public.checkins enable row level security;

-- Users can see checkins in their org
create policy "checkins_select_own_org" on public.checkins
  for select using (
    org_id in (select org_id from public.profiles where id = auth.uid())
  );

-- Users can insert their own checkins
create policy "checkins_insert_own" on public.checkins
  for insert with check (user_id = auth.uid());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (via trigger)
-- ============================================================

-- Default org for new signups (making-miles-matter)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from public.orgs where slug = 'making-miles-matter' limit 1;

  insert into public.profiles (id, org_id, email, full_name)
  values (
    new.id,
    default_org_id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SEED DATA
-- ============================================================

insert into public.orgs (slug, name, primary_color, secondary_color) values
  ('making-miles-matter', 'Making Miles Matter', '#2563eb', '#f59e0b'),
  ('hhh', 'HHH', '#dc2626', '#000000');

-- ============================================================
-- STORAGE: checkins bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', false);

-- Users can upload to their own folder
create policy "checkins_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own org's checkin photos
create policy "checkins_storage_select" on storage.objects
  for select using (
    bucket_id = 'checkins'
  );
