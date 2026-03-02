-- ============================================================
-- Early incentives engine
-- ============================================================

-- Add early_bonus source for raffle entries
ALTER TYPE public.raffle_entry_source ADD VALUE IF NOT EXISTS 'early_bonus';

-- Track merch perks earned at registration time
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS early_merch_perk text[] NOT NULL DEFAULT '{}'::text[];

-- Index for perk queries (e.g. socks fulfilment export)
CREATE INDEX IF NOT EXISTS registrations_early_merch_perk_idx
  ON public.registrations USING GIN (early_merch_perk);

-- Note: raffle_entries(source_id) unique constraint already exists
-- from migration 00010 (raffle_entries_unique_source_id).
