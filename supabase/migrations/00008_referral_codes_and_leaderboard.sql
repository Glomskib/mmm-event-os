-- ============================================================
-- Referral Codes, Rewards, and Leaderboard View
-- ============================================================

-- referral_codes: one code per user per org
create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  unique(user_id, org_id)
);

alter table public.referral_codes enable row level security;

-- Users can read their own code
create policy "referral_codes_select_own" on public.referral_codes
  for select using (user_id = auth.uid());

-- Admins can read all codes in their org
create policy "referral_codes_select_admin" on public.referral_codes
  for select using (public.is_org_admin(org_id));

-- Service role inserts (trigger / backfill)
create policy "referral_codes_insert_service" on public.referral_codes
  for insert with check (true);

create index referral_codes_user_idx on public.referral_codes (user_id);
create index referral_codes_code_idx on public.referral_codes (code);

-- referral_rewards: milestone badges unlocked
create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tier text not null,
  unlocked_at timestamptz not null default now(),
  source_count integer not null default 0,
  unique(user_id, tier)
);

alter table public.referral_rewards enable row level security;

-- Users can read their own rewards
create policy "referral_rewards_select_own" on public.referral_rewards
  for select using (user_id = auth.uid());

-- Admins can read all rewards
create policy "referral_rewards_select_admin" on public.referral_rewards
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Service role inserts
create policy "referral_rewards_insert_service" on public.referral_rewards
  for insert with check (true);

-- ============================================================
-- generate_referral_code(): name prefix (4 chars) + uuid suffix (4 chars)
-- ============================================================
create or replace function public.generate_referral_code(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_code text;
  v_attempts int := 0;
begin
  -- Take first 4 alpha chars from name, uppercase, fallback to 'USER'
  v_prefix := upper(regexp_replace(coalesce(p_name, ''), '[^a-zA-Z]', '', 'g'));
  v_prefix := left(v_prefix, 4);
  if length(v_prefix) < 2 then
    v_prefix := 'USER';
  end if;

  loop
    v_code := v_prefix || '-' || upper(left(replace(gen_random_uuid()::text, '-', ''), 4));
    -- Check for collision
    if not exists (select 1 from public.referral_codes where code = v_code) then
      return v_code;
    end if;
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      -- Extend suffix to avoid infinite loop
      v_code := v_prefix || '-' || upper(left(replace(gen_random_uuid()::text, '-', ''), 8));
      return v_code;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- Trigger: auto-create referral code when a profile is created
-- ============================================================
create or replace function public.on_profile_created_referral_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  v_code := public.generate_referral_code(new.full_name);
  insert into public.referral_codes (org_id, user_id, code)
  values (new.org_id, new.id, v_code);
  return new;
end;
$$;

create trigger trg_profile_referral_code
  after insert on public.profiles
  for each row
  execute function public.on_profile_created_referral_code();

-- ============================================================
-- Backfill: create codes for all existing profiles
-- ============================================================
insert into public.referral_codes (org_id, user_id, code)
select
  p.org_id,
  p.id,
  public.generate_referral_code(p.full_name)
from public.profiles p
where not exists (
  select 1 from public.referral_codes rc
  where rc.user_id = p.id and rc.org_id = p.org_id
);

-- ============================================================
-- Leaderboard view
-- ============================================================
create or replace view public.referral_leaderboard_v as
select
  rc.user_id,
  rc.code,
  rc.org_id,
  p.full_name,
  p.avatar_url,
  count(r.id)::int as referral_count,
  dense_rank() over (partition by rc.org_id order by count(r.id) desc)::int as rank
from public.referral_codes rc
join public.profiles p on p.id = rc.user_id
left join public.registrations r
  on r.referral_code = rc.code
  and r.status = 'paid'
  and r.amount > 0
group by rc.user_id, rc.code, rc.org_id, p.full_name, p.avatar_url
having count(r.id) > 0;
