-- ============================================================
-- Add "free" registration status + waiver enforcement fields
-- ============================================================

-- 1. Extend the registration_status enum with "free"
alter type public.registration_status add value if not exists 'free';

-- 2. Add waiver columns to registrations
alter table public.registrations
  add column waiver_accepted boolean not null default false,
  add column waiver_accepted_at timestamptz,
  add column waiver_ip text,
  add column waiver_user_agent text,
  add column waiver_version text;

-- 3. Enforce: paid or free registrations must have waiver_accepted = true.
--    Pending/cancelled rows are exempt (waiver captured at checkout time).
alter table public.registrations
  add constraint waiver_required_paid
  check (
    status not in ('paid', 'free')
    or waiver_accepted = true
  );
