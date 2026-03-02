-- Migration 00031: Route Experience module
--
-- 1. New media_placement values for route assets
-- 2. New media_kind value for generic binary files (e.g. GPX)
-- 3. New columns on events for route stats

-- Media placements
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'elevation_chart';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'route_embed';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'route_gpx';

-- Media kind (generic file — GPX, PDF, etc.)
ALTER TYPE media_kind ADD VALUE IF NOT EXISTS 'file';

-- Route stat fields on events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS elevation_gain  INTEGER,
  ADD COLUMN IF NOT EXISTS aid_stations    INTEGER,
  ADD COLUMN IF NOT EXISTS terrain_type    TEXT;

COMMENT ON COLUMN events.elevation_gain IS 'Total elevation gain in feet (optional).';
COMMENT ON COLUMN events.aid_stations   IS 'Number of aid stations on the route (optional).';
COMMENT ON COLUMN events.terrain_type   IS 'Terrain description, e.g. "Gravel / Pavement" (optional).';
