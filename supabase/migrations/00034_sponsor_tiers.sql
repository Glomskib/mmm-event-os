-- ── Sponsor Tier Hierarchy ───────────────────────────────────────
-- Add tier, display ordering, and visibility toggles to sponsors

ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS tier                TEXT    NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS display_order       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_on_homepage    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_on_event_page  BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill: ensure all existing rows have 'community' tier
-- (DEFAULT handles new rows; this covers any pre-existing NULL edge cases)
UPDATE sponsors SET tier = 'community' WHERE tier IS NULL OR tier = '';
