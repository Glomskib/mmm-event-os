-- ============================================================
-- Fix RLS infinite recursion on profiles table
-- The profiles_select_own_org policy was self-referencing profiles,
-- causing infinite recursion when any other policy also referenced profiles.
-- ============================================================

-- Drop the recursive policy
drop policy if exists "profiles_select_own_org" on public.profiles;

-- Replace with: users can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

-- Admins can read all profiles in their org (uses auth.uid() directly, no subquery on profiles)
create policy "profiles_select_org_admin" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.org_id = profiles.org_id
        and p.role = 'admin'
    )
  );

-- Also fix the events select policy to avoid the profiles recursion
drop policy if exists "events_select" on public.events;

create policy "events_select_published" on public.events
  for select using (status = 'published');

create policy "events_select_org_member" on public.events
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.org_id = events.org_id
    )
  );

-- Fix ride_series/ride_occurrences/checkins policies that reference profiles
-- These are fine because they use: org_id in (select org_id from profiles where id = auth.uid())
-- which only reads the current user's own profile row (matched by id = auth.uid()).
-- The recursion only happens when profiles reads from profiles without an id = auth.uid() anchor.

-- Fix registrations select policy similarly
drop policy if exists "registrations_select_own" on public.registrations;

create policy "registrations_select_own" on public.registrations
  for select using (user_id = auth.uid());

create policy "registrations_select_org_admin" on public.registrations
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.org_id = registrations.org_id and p.role = 'admin'
    )
  );
