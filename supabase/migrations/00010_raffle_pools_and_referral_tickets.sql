-- ============================================================
-- Raffle pool separation + referral ticket generation
-- ============================================================

-- Add tickets_count to support multi-ticket entries (referral milestones)
ALTER TABLE public.raffle_entries
  ADD COLUMN tickets_count integer NOT NULL DEFAULT 1;

-- Add source_id to link raffle entries to their origin (e.g., referral_rewards.id)
ALTER TABLE public.raffle_entries
  ADD COLUMN source_id text;

-- Add 'event' to raffle_entry_source enum for future event-based entries
ALTER TYPE public.raffle_entry_source ADD VALUE IF NOT EXISTS 'event';

-- Unique constraint: one raffle entry per referral reward
-- (prevents duplicate raffle tickets if milestone cron runs multiple times)
ALTER TABLE public.raffle_entries
  ADD CONSTRAINT raffle_entries_unique_source_id UNIQUE (source_id)
  DEFERRABLE INITIALLY DEFERRED;

-- Index for pool queries
CREATE INDEX raffle_entries_source_idx ON public.raffle_entries (source);
