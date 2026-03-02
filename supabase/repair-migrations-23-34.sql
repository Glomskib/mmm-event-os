-- ============================================================
-- REPAIR SCRIPT: Apply migrations 00023–00034 idempotently
-- Safe to run even if some objects already exist.
-- Paste this entire file into Supabase SQL Editor → Run
-- ============================================================


-- ── 00023: Add slug column to events ─────────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.events
  SET slug = REGEXP_REPLACE(
               REGEXP_REPLACE(LOWER(title), '[^a-z0-9]+', '-', 'g'),
               '^-+|-+$', '', 'g'
             )
  WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON public.events (slug);


-- ── 00024: Finalize HHH title + re-slug ──────────────────────────────────────

DO $$
DECLARE mmm_org_id uuid;
BEGIN
  SELECT id INTO mmm_org_id FROM public.orgs WHERE slug = 'making-miles-matter' LIMIT 1;
  IF mmm_org_id IS NULL THEN RETURN; END IF;

  UPDATE public.events
    SET title = 'Hancock Horizontal Hundred 2026'
    WHERE org_id = mmm_org_id
      AND title IN ('Houghton Hundred', 'Hancock Horizontal Hundred', 'HHH 2026');

  UPDATE public.events
    SET slug = REGEXP_REPLACE(
                 REGEXP_REPLACE(LOWER(title), '[^a-z0-9]+', '-', 'g'),
                 '^-+|-+$', '', 'g'
               )
    WHERE org_id = mmm_org_id;
END;
$$;


-- ── 00025: media_assets table ─────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE media_entity_type AS ENUM ('event','ride_series','ride_occurrence','sponsor','page');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE media_kind AS ENUM ('image','video','embed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE media_placement AS ENUM ('hero','gallery','section','banner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.media_assets (
  id           uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid             NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  entity_type  media_entity_type NOT NULL,
  entity_id    uuid             NOT NULL,
  kind         media_kind       NOT NULL,
  placement    media_placement  NOT NULL DEFAULT 'gallery',
  title        text,
  caption      text,
  url          text             NOT NULL,
  thumb_url    text,
  sort_order   int              NOT NULL DEFAULT 0,
  is_active    boolean          NOT NULL DEFAULT true,
  created_at   timestamptz      NOT NULL DEFAULT now(),
  updated_at   timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_entity
  ON public.media_assets (org_id, entity_type, entity_id, placement, sort_order);

CREATE INDEX IF NOT EXISTS idx_media_assets_active
  ON public.media_assets (org_id, is_active);

CREATE OR REPLACE FUNCTION public.set_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER media_assets_updated_at
    BEFORE UPDATE ON public.media_assets
    FOR EACH ROW EXECUTE FUNCTION public.set_media_assets_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "media_assets_public_select" ON public.media_assets FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_assets_admin_insert" ON public.media_assets FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.org_id = media_assets.org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_assets_admin_update" ON public.media_assets FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.org_id = media_assets.org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_assets_admin_delete" ON public.media_assets FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.org_id = media_assets.org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
  ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "media_storage_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_storage_admin_insert" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_storage_admin_delete" ON storage.objects FOR DELETE
    USING (bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 00026: hhh_legacy_entries ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hhh_legacy_entries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year       int         NOT NULL,
  miles      int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year),
  CHECK (year BETWEEN 1974 AND 2024),
  CHECK (miles >= 0 AND miles <= 300)
);

CREATE OR REPLACE FUNCTION public.set_hhh_legacy_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER hhh_legacy_entries_updated_at
    BEFORE UPDATE ON public.hhh_legacy_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_hhh_legacy_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.hhh_legacy_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "hhh_legacy_own_select"  ON public.hhh_legacy_entries FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "hhh_legacy_own_insert"  ON public.hhh_legacy_entries FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "hhh_legacy_own_update"  ON public.hhh_legacy_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "hhh_legacy_own_delete"  ON public.hhh_legacy_entries FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "hhh_legacy_admin_select" ON public.hhh_legacy_entries FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 00027: series_key on events + hhh_shopify_imports ────────────────────────

ALTER TABLE events ADD COLUMN IF NOT EXISTS series_key text NOT NULL DEFAULT '';

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT events_series_key_format
    CHECK (char_length(series_key) <= 20 AND series_key = lower(series_key));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS events_org_series_key_idx ON events (org_id, series_key) WHERE series_key != '';

UPDATE events SET series_key = 'hhh'
  WHERE series_key = '' AND (title ILIKE '%Hancock Horizontal Hundred%' OR slug ILIKE '%hancock-horizontal-hundred%');

UPDATE events SET series_key = 'fff'
  WHERE series_key = '' AND (title ILIKE '%Findlay Further Fondo%' OR title ILIKE '%FlatFest%');

CREATE TABLE IF NOT EXISTS hhh_shopify_imports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES orgs(id),
  order_id        text        NOT NULL,
  order_name      text,
  email           text        NOT NULL,
  first_name      text,
  last_name       text,
  distance_label  text,
  miles           integer     NOT NULL DEFAULT 0,
  event_year      integer     NOT NULL,
  financial_status text,
  imported_at     timestamptz NOT NULL DEFAULT now(),
  matched_user_id uuid        REFERENCES profiles(id),
  matched_at      timestamptz,
  notes           text,
  CONSTRAINT hhh_shopify_imports_order_unique UNIQUE (org_id, order_id)
);

CREATE INDEX IF NOT EXISTS hhh_shopify_imports_email_idx ON hhh_shopify_imports (lower(email));
CREATE INDEX IF NOT EXISTS hhh_shopify_imports_matched_user_idx ON hhh_shopify_imports (matched_user_id) WHERE matched_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hhh_shopify_imports_org_year_idx ON hhh_shopify_imports (org_id, event_year);

ALTER TABLE hhh_shopify_imports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_all_hhh_shopify_imports" ON hhh_shopify_imports FOR ALL TO authenticated
    USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 00028: raw_json column + rebuild leaderboard view ────────────────────────

ALTER TABLE hhh_shopify_imports ADD COLUMN IF NOT EXISTS raw_json jsonb;

DROP VIEW IF EXISTS hhh_legacy_leaderboard_v;

CREATE VIEW hhh_legacy_leaderboard_v AS
WITH
manual AS (
  SELECT user_id, SUM(miles)::integer AS manual_miles FROM hhh_legacy_entries GROUP BY user_id
),
shopify_matched AS (
  SELECT matched_user_id AS user_id, SUM(miles)::integer AS imported_miles, MAX(event_year) AS last_import_year
  FROM hhh_shopify_imports WHERE matched_user_id IS NOT NULL AND financial_status = 'paid'
  GROUP BY matched_user_id
),
auto AS (
  SELECT r.user_id,
    SUM(COALESCE((regexp_match(r.distance,'(\d+)'))[1]::integer,0))::integer AS auto_miles,
    COUNT(*)::integer AS hhh_reg_count,
    MAX(EXTRACT(YEAR FROM e.date::date))::integer AS last_hhh_year
  FROM registrations r JOIN events e ON e.id = r.event_id
  WHERE e.series_key = 'hhh' AND r.status IN ('paid','free') AND EXTRACT(YEAR FROM e.date::date) >= 2025
  GROUP BY r.user_id
),
registered AS (
  SELECT p.id AS user_id, COALESCE(p.full_name,p.email) AS display_name, p.email,
    COALESCE(m.manual_miles,0) AS manual_miles, COALESCE(sm.imported_miles,0) AS imported_miles,
    COALESCE(a.auto_miles,0) AS auto_miles, COALESCE(a.hhh_reg_count,0) AS hhh_reg_count,
    GREATEST(a.last_hhh_year,sm.last_import_year) AS last_hhh_year
  FROM profiles p
  LEFT JOIN manual m ON m.user_id=p.id
  LEFT JOIN shopify_matched sm ON sm.user_id=p.id
  LEFT JOIN auto a ON a.user_id=p.id
  WHERE COALESCE(m.manual_miles,0)>0 OR COALESCE(sm.imported_miles,0)>0 OR COALESCE(a.auto_miles,0)>0
),
shopify_unmatched AS (
  SELECT NULL::uuid AS user_id,
    COALESCE(NULLIF(TRIM(COALESCE(first_name,'')||' '||COALESCE(last_name,'')),''),email) AS display_name,
    email, 0 AS manual_miles, SUM(miles)::integer AS imported_miles, 0 AS auto_miles,
    0 AS hhh_reg_count, MAX(event_year)::integer AS last_hhh_year
  FROM hhh_shopify_imports WHERE matched_user_id IS NULL AND financial_status='paid'
  GROUP BY email,first_name,last_name
)
SELECT user_id,display_name,email,manual_miles,imported_miles,auto_miles,hhh_reg_count,last_hhh_year,
  (manual_miles+imported_miles+auto_miles)::integer AS total_hhh_miles FROM registered
UNION ALL
SELECT user_id,display_name,email,manual_miles,imported_miles,auto_miles,hhh_reg_count,last_hhh_year,
  (manual_miles+imported_miles+auto_miles)::integer AS total_hhh_miles FROM shopify_unmatched;


-- ── 00029: Expand media_placement enum ───────────────────────────────────────

ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'hero_secondary';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'route_preview';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'testimonial';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'inline_section';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'background_loop';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'sponsor_showcase';


-- ── 00030: capacity + registration_open on events ────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT TRUE;


-- ── 00031: Route experience columns ──────────────────────────────────────────

ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'elevation_chart';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'route_embed';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'route_gpx';

DO $$ BEGIN ALTER TYPE media_kind ADD VALUE IF NOT EXISTS 'file'; EXCEPTION WHEN others THEN NULL; END $$;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS elevation_gain INTEGER,
  ADD COLUMN IF NOT EXISTS aid_stations   INTEGER,
  ADD COLUMN IF NOT EXISTS terrain_type   TEXT;


-- ── 00032: Route embed HTML on ride_series / ride_occurrences ─────────────────

ALTER TABLE ride_series      ADD COLUMN IF NOT EXISTS route_embed_html TEXT;
ALTER TABLE ride_occurrences ADD COLUMN IF NOT EXISTS route_embed_html TEXT;


-- ── 00033: Jersey voting tables ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jersey_designs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  series_key  TEXT        NOT NULL DEFAULT 'hhh',
  year        INTEGER     NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  image_url   TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jersey_votes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  design_id  uuid        NOT NULL REFERENCES jersey_designs(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year       INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT jersey_votes_user_year_unique UNIQUE (user_id, year)
);

ALTER TABLE jersey_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jersey_votes   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "jersey_designs_public_read" ON jersey_designs FOR SELECT USING (active = TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "jersey_votes_public_read"   ON jersey_votes   FOR SELECT USING (TRUE);          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "jersey_votes_auth_insert"   ON jersey_votes   FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "jersey_votes_auth_delete"   ON jersey_votes   FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "jersey_designs_service_role" ON jersey_designs FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "jersey_votes_service_role"   ON jersey_votes   FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 00034: Sponsor tier columns ───────────────────────────────────────────────

ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS tier               TEXT    NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS display_order      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_on_homepage   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_on_event_page BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE sponsors SET tier = 'community' WHERE tier IS NULL OR tier = '';


-- ── Verify ────────────────────────────────────────────────────────────────────
-- Run this after to confirm:
-- SELECT id, title, slug, status, series_key FROM events ORDER BY created_at DESC LIMIT 10;
