-- Migration 00032: Add route embed HTML fields to ride_series and ride_occurrences
--
-- These fields store sanitized iframe HTML from RideWithGPS or Strava embeds.
-- Occurrence values override series values on display (consistent with existing pattern).

ALTER TABLE ride_series
  ADD COLUMN IF NOT EXISTS route_embed_html TEXT;

ALTER TABLE ride_occurrences
  ADD COLUMN IF NOT EXISTS route_embed_html TEXT;

COMMENT ON COLUMN ride_series.route_embed_html    IS 'Sanitized iframe embed HTML for the default route (RideWithGPS or Strava only).';
COMMENT ON COLUMN ride_occurrences.route_embed_html IS 'Per-occurrence override embed HTML; takes precedence over series default.';
