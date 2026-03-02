-- Migration 00030: Add capacity and registration_open to events table
-- capacity: optional seat cap; NULL means unlimited
-- registration_open: controls whether urgency UI (countdown, spots remaining) is shown

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN events.capacity IS 'Optional seat cap. NULL means unlimited.';
COMMENT ON COLUMN events.registration_open IS 'When false, urgency UI (countdown, spots remaining) is suppressed.';
