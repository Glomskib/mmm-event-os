-- 00007: Add participant identity, emergency contacts, waiver snapshot + PDF storage
-- These fields capture signer info and emergency data for ride-day operations.

-- New columns on registrations
alter table registrations
  add column if not exists participant_name text,
  add column if not exists participant_email text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists waiver_pdf_url text,
  add column if not exists waiver_snapshot_text text;

-- Enforce that active registrations have participant + emergency info filled
alter table registrations
  add constraint registrations_participant_required
  check (
    status not in ('pending', 'paid', 'free')
    or (
      participant_name is not null
      and participant_email is not null
      and emergency_contact_name is not null
      and emergency_contact_phone is not null
    )
  );

-- Private storage bucket for signed waiver PDFs
insert into storage.buckets (id, name, public)
values ('waivers', 'waivers', false)
on conflict (id) do nothing;
