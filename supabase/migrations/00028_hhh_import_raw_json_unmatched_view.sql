-- 00028: Add raw_json audit column to hhh_shopify_imports
--        Rebuild hhh_legacy_leaderboard_v to include unmatched Shopify rows

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add raw_json column for import audit trail
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE hhh_shopify_imports
  ADD COLUMN IF NOT EXISTS raw_json jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Rebuild hhh_legacy_leaderboard_v to include unmatched Shopify imports
--    (i.e. riders who have a Shopify purchase but no MMM account)
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

-- B: Shopify imports matched to a profile
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

-- C: In-app registrations via series_key='hhh' (2025+)
auto AS (
  SELECT
    r.user_id,
    SUM(
      COALESCE((regexp_match(r.distance, '(\d+)'))[1]::integer, 0)
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

-- Registered-account holders with any HHH activity
registered AS (
  SELECT
    p.id                               AS user_id,
    COALESCE(p.full_name, p.email)     AS display_name,
    p.email,
    COALESCE(m.manual_miles, 0)        AS manual_miles,
    COALESCE(sm.imported_miles, 0)     AS imported_miles,
    COALESCE(a.auto_miles, 0)          AS auto_miles,
    COALESCE(a.hhh_reg_count, 0)       AS hhh_reg_count,
    GREATEST(a.last_hhh_year, sm.last_import_year) AS last_hhh_year
  FROM profiles p
  LEFT JOIN manual        m  ON m.user_id   = p.id
  LEFT JOIN shopify_matched sm ON sm.user_id = p.id
  LEFT JOIN auto           a  ON a.user_id   = p.id
  WHERE
    COALESCE(m.manual_miles, 0)    > 0
    OR COALESCE(sm.imported_miles, 0) > 0
    OR COALESCE(a.auto_miles, 0)   > 0
),

-- Unmatched Shopify imports (no MMM account)
shopify_unmatched AS (
  SELECT
    NULL::uuid AS user_id,
    -- Build display name from first/last or fall back to email
    COALESCE(
      NULLIF(
        TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')),
        ''
      ),
      email
    ) AS display_name,
    email,
    0 AS manual_miles,
    SUM(miles)::integer AS imported_miles,
    0 AS auto_miles,
    0 AS hhh_reg_count,
    MAX(event_year)::integer AS last_hhh_year
  FROM hhh_shopify_imports
  WHERE matched_user_id IS NULL
    AND financial_status = 'paid'
  GROUP BY email, first_name, last_name
)

SELECT
  user_id, display_name, email,
  manual_miles, imported_miles, auto_miles,
  hhh_reg_count, last_hhh_year,
  (manual_miles + imported_miles + auto_miles)::integer AS total_hhh_miles
FROM registered

UNION ALL

SELECT
  user_id, display_name, email,
  manual_miles, imported_miles, auto_miles,
  hhh_reg_count, last_hhh_year,
  (manual_miles + imported_miles + auto_miles)::integer AS total_hhh_miles
FROM shopify_unmatched;
