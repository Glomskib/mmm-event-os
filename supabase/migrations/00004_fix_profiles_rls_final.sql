-- ============================================================
-- Final fix: profiles must NEVER self-reference in RLS policies.
-- Use a security definer function to break the recursion.
-- ============================================================

-- Helper function: get current user's org_id without triggering RLS
create or replace function public.get_my_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- Helper function: check if current user is admin
create or replace function public.is_org_admin(check_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and org_id = check_org_id
      and role = 'admin'
  )
$$;

-- ============================================================
-- Fix profiles policies
-- ============================================================
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_org_admin" on public.profiles;

-- Users see their own row
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

-- Admins see all profiles in their org
create policy "profiles_select_org_admin" on public.profiles
  for select using (public.is_org_admin(org_id));

-- ============================================================
-- Fix events policies
-- ============================================================
drop policy if exists "events_select_published" on public.events;
drop policy if exists "events_select_org_member" on public.events;

-- Anyone can see published events
create policy "events_select_published" on public.events
  for select using (status = 'published');

-- Org members can see all events (incl. drafts)
create policy "events_select_org_member" on public.events
  for select using (org_id = public.get_my_org_id());

-- ============================================================
-- Fix registrations policies
-- ============================================================
drop policy if exists "registrations_select_own" on public.registrations;
drop policy if exists "registrations_select_org_admin" on public.registrations;

create policy "registrations_select_own" on public.registrations
  for select using (user_id = auth.uid());

create policy "registrations_select_org_admin" on public.registrations
  for select using (public.is_org_admin(org_id));

-- ============================================================
-- Fix remaining policies that query profiles
-- ============================================================

-- events insert/update/delete
drop policy if exists "events_insert" on public.events;
drop policy if exists "events_update" on public.events;
drop policy if exists "events_delete" on public.events;

create policy "events_insert" on public.events
  for insert with check (public.is_org_admin(org_id));
create policy "events_update" on public.events
  for update using (public.is_org_admin(org_id));
create policy "events_delete" on public.events
  for delete using (public.is_org_admin(org_id));

-- ride_series
drop policy if exists "ride_series_insert" on public.ride_series;
drop policy if exists "ride_series_update" on public.ride_series;

create policy "ride_series_insert" on public.ride_series
  for insert with check (public.is_org_admin(org_id));
create policy "ride_series_update" on public.ride_series
  for update using (public.is_org_admin(org_id));

-- ride_occurrences
drop policy if exists "ride_occurrences_insert" on public.ride_occurrences;
drop policy if exists "ride_occurrences_update" on public.ride_occurrences;

create policy "ride_occurrences_insert" on public.ride_occurrences
  for insert with check (public.is_org_admin(org_id));
create policy "ride_occurrences_update" on public.ride_occurrences
  for update using (public.is_org_admin(org_id));

-- checkins
drop policy if exists "checkins_select_own_org" on public.checkins;

create policy "checkins_select_own_org" on public.checkins
  for select using (org_id = public.get_my_org_id());

-- referral_credits
drop policy if exists "referral_credits_select" on public.referral_credits;

create policy "referral_credits_select_own" on public.referral_credits
  for select using (referrer_user_id = auth.uid());

create policy "referral_credits_select_admin" on public.referral_credits
  for select using (public.is_org_admin(org_id));
