-- 00027: Add events.series_key, hhh_shopify_imports, and rebuild hhh_legacy_leaderboard_v

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add series_key to events
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS series_key text NOT NULL DEFAULT '';

ALTER TABLE events
  ADD CONSTRAINT events_series_key_format
    CHECK (char_length(series_key) <= 20 AND series_key = lower(series_key));

CREATE INDEX IF NOT EXISTS events_org_series_key_idx
  ON events (org_id, series_key)
  WHERE series_key != '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill known series keys
-- ─────────────────────────────────────────────────────────────────────────────
-- HHH = Hancock Horizontal Hundred
UPDATE events
SET series_key = 'hhh'
WHERE series_key = ''
  AND (
    title ILIKE '%Hancock Horizontal Hundred%'
    OR slug ILIKE '%hancock-horizontal-hundred%'
    OR slug ILIKE '%hhh%'
  );

-- FFF = FlatFest Friday / similar
UPDATE events
SET series_key = 'fff'
WHERE series_key = ''
  AND (
    title ILIKE '%FlatFest%'
    OR slug ILIKE '%flatfest%'
    OR slug ILIKE '%fff%'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Shopify import table for HHH 2025+ registrations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hhh_shopify_imports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES orgs(id),
  order_id        text        NOT NULL,           -- Shopify order ID
  order_name      text,                           -- e.g. "#1234"
  email           text        NOT NULL,
  first_name      text,
  last_name       text,
  distance_label  text,                           -- e.g. "100 Mile", "62 Mile"
  miles           integer     NOT NULL DEFAULT 0, -- parsed from distance_label
  event_year      integer     NOT NULL,           -- e.g. 2025
  financial_status text,                          -- "paid", "refunded", etc.
  imported_at     timestamptz NOT NULL DEFAULT now(),
  matched_user_id uuid        REFERENCES profiles(id),  -- set when email matched
  matched_at      timestamptz,
  notes           text,

  CONSTRAINT hhh_shopify_imports_order_unique UNIQUE (org_id, order_id)
);

CREATE INDEX IF NOT EXISTS hhh_shopify_imports_email_idx ON hhh_shopify_imports (lower(email));
CREATE INDEX IF NOT EXISTS hhh_shopify_imports_matched_user_idx ON hhh_shopify_imports (matched_user_id) WHERE matched_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hhh_shopify_imports_org_year_idx ON hhh_shopify_imports (org_id, event_year);

-- RLS: admin-only (no public reads — contains PII)
ALTER TABLE hhh_shopify_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_hhh_shopify_imports"
  ON hhh_shopify_imports
  FOR ALL
  TO authenticated
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Rebuild hhh_legacy_leaderboard_v
--    Sources:
--      A) manual entries (hhh_legacy_entries, 1974–2024)
--      B) Shopify imports (hhh_shopify_imports, matched or unmatched)
--      C) in-app registrations with series_key='hhh', status in (paid,free), year >= 2025
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS hhh_legacy_leaderboard_v;

CREATE VIEW hhh_legacy_leaderboard_v AS
WITH

-- A: Manual legacy miles per user (1974–2024)
manual AS (
  SELECT
    user_id,
    SUM(miles)::integer AS manual_miles
  FROM hhh_legacy_entries
  GROUP BY user_id
),

-- B: Shopify imports — aggregate by matched user OR by email (for unmatched)
shopify_matched AS (
  SELECT
    matched_user_id AS user_id,
    SUM(miles)::integer AS imported_miles,
    MAX(event_year) AS last_import_year
  FROM hhh_shopify_imports
  WHERE matched_user_id IS NOT NULL
    AND financial_status = 'paid'
  GROUP BY matched_user_id
),

-- C: In-app registrations via series_key='hhh'
auto AS (
  SELECT
    r.user_id,
    -- extract leading integer from distance string, clamp to 0 if not parseable
    SUM(
      COALESCE(
        (regexp_match(r.distance, '(\d+)'))[1]::integer,
        0
      )
    )::integer AS auto_miles,
    COUNT(*)::integer AS hhh_reg_count,
    MAX(EXTRACT(YEAR FROM e.date::date))::integer AS last_hhh_year
  FROM registrations r
  JOIN events e ON e.id = r.event_id
  WHERE e.series_key = 'hhh'
    AND r.status IN ('paid', 'free')
    AND EXTRACT(YEAR FROM e.date::date) >= 2025
  GROUP BY r.user_id
),

-- Combine registered users (manual + auto + shopify matched)
registered AS (
  SELECT
    p.id AS user_id,
    COALESCE(p.full_name, p.email) AS display_name,
    p.email,
    COALESCE(m.manual_miles, 0) AS manual_miles,
    COALESCE(sm.imported_miles, 0) AS imported_miles,
    COALESCE(a.auto_miles, 0) AS auto_miles,
    COALESCE(a.hhh_reg_count, 0) AS hhh_reg_count,
    GREATEST(a.last_hhh_year, sm.last_import_year) AS last_hhh_year
  FROM profiles p
  LEFT JOIN manual m ON m.user_id = p.id
  LEFT JOIN shopify_matched sm ON sm.user_id = p.id
  LEFT JOIN auto a ON a.user_id = p.id
  WHERE
    COALESCE(m.manual_miles, 0) > 0
    OR COALESCE(sm.imported_miles, 0) > 0
    OR COALESCE(a.auto_miles, 0) > 0
)

SELECT
  user_id,
  display_name,
  email,
  manual_miles,
  imported_miles,
  auto_miles,
  hhh_reg_count,
  last_hhh_year,
  (manual_miles + imported_miles + auto_miles)::integer AS total_hhh_miles
FROM registered;
