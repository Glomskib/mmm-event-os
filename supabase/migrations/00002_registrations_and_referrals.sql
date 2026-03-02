-- ============================================================
-- Registrations + Referral Credits
-- ============================================================

create type public.registration_status as enum ('pending', 'paid', 'refunded', 'cancelled');

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs on delete cascade,
  user_id uuid references auth.users on delete set null,
  event_id uuid not null references public.events on delete cascade,
  distance text not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount integer not null default 0, -- cents
  status public.registration_status not null default 'pending',
  referral_code text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.registrations enable row level security;

-- Users can read their own registrations
create policy "registrations_select_own" on public.registrations
  for select using (
    user_id = auth.uid()
    or org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Service role inserts via webhook (no user-facing insert)
create policy "registrations_insert_service" on public.registrations
  for insert with check (true);

-- Service role updates via webhook
create policy "registrations_update_service" on public.registrations
  for update using (true);

-- Referral credits
create table public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs on delete cascade,
  registration_id uuid not null references public.registrations on delete cascade,
  referral_code text not null,
  referrer_user_id uuid references auth.users on delete set null,
  amount integer not null default 0, -- cents credited
  voided boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.referral_credits enable row level security;

create policy "referral_credits_select" on public.referral_credits
  for select using (
    referrer_user_id = auth.uid()
    or org_id in (
      select org_id from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "referral_credits_insert_service" on public.referral_credits
  for insert with check (true);

create policy "referral_credits_update_service" on public.referral_credits
  for update using (true);

-- Index for webhook lookups
create index registrations_stripe_session_idx on public.registrations (stripe_session_id);
create index registrations_stripe_pi_idx on public.registrations (stripe_payment_intent_id);
create index referral_credits_registration_idx on public.referral_credits (registration_id);
