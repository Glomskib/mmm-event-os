-- Donations table — stores completed Stripe donation payments
create table if not exists donations (
  id                       uuid        default gen_random_uuid() primary key,
  org_id                   uuid        not null references orgs (id),
  stripe_session_id        text        unique,
  stripe_payment_intent_id text,
  amount                   integer     not null,  -- cents
  donor_email              text,
  donor_name               text,
  created_at               timestamptz default now()
);

-- RLS
alter table donations enable row level security;

-- Admins can read donations for their org
create policy "admin_select_donations"
  on donations for select
  using (
    org_id in (
      select org_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
