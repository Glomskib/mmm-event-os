-- Add event-day operational flags to registrations
alter table registrations
  add column bib_issued boolean not null default false,
  add column emergency_flag boolean not null default false;
