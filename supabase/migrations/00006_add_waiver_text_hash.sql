-- ============================================================
-- Add waiver_text_hash to registrations
-- (waiver_accepted, waiver_ip, etc. added in 00005)
-- ============================================================

alter table public.registrations
  add column waiver_text_hash text;
