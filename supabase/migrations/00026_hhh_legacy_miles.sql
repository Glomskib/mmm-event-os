-- HHH Legacy Miles: manual entry for 1974–2024, plus auto-calculated from registrations

-- ─── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE public.hhh_legacy_entries (
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

-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_hhh_legacy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hhh_legacy_entries_updated_at
  BEFORE UPDATE ON public.hhh_legacy_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_hhh_legacy_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.hhh_legacy_entries ENABLE ROW LEVEL SECURITY;

-- Users can manage their own entries
CREATE POLICY "hhh_legacy_own_select"
  ON public.hhh_legacy_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "hhh_legacy_own_insert"
  ON public.hhh_legacy_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hhh_legacy_own_update"
  ON public.hhh_legacy_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hhh_legacy_own_delete"
  ON public.hhh_legacy_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can read all entries
CREATE POLICY "hhh_legacy_admin_select"
  ON public.hhh_legacy_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ─── View: hhh_legacy_leaderboard_v ──────────────────────────────────────────

CREATE VIEW public.hhh_legacy_leaderboard_v AS
WITH legacy AS (
  SELECT
    user_id,
    COALESCE(SUM(miles), 0)::int AS legacy_miles_total
  FROM public.hhh_legacy_entries
  GROUP BY user_id
),
hhh_regs AS (
  SELECT
    r.user_id,
    COALESCE(
      NULLIF((regexp_match(r.distance, '(\d+)'))[1], '')::int,
      0
    ) AS miles,
    EXTRACT(YEAR FROM e.date)::int AS year
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE
    (
      e.title ILIKE '%Hancock Horizontal Hundred%'
      OR e.slug LIKE 'hancock-horizontal-hundred%'
    )
    AND r.status IN ('paid', 'free')
    AND r.user_id IS NOT NULL
    AND EXTRACT(YEAR FROM e.date) >= 2025
),
auto AS (
  SELECT
    user_id,
    COALESCE(SUM(miles), 0)::int  AS auto_miles_total,
    COUNT(*)::int                  AS hhh_reg_count,
    MAX(year)                      AS last_hhh_year
  FROM hhh_regs
  GROUP BY user_id
)
SELECT
  COALESCE(l.user_id, a.user_id) AS user_id,
  COALESCE(p.full_name, p.email, 'Rider')::text AS display_name,
  COALESCE(l.legacy_miles_total, 0)::int AS legacy_miles_total,
  COALESCE(a.auto_miles_total, 0)::int   AS auto_miles_total,
  (COALESCE(l.legacy_miles_total, 0) + COALESCE(a.auto_miles_total, 0))::int AS total_miles,
  COALESCE(a.hhh_reg_count, 0)::int AS hhh_reg_count,
  a.last_hhh_year
FROM legacy l
FULL OUTER JOIN auto a ON a.user_id = l.user_id
LEFT JOIN public.profiles p ON p.id = COALESCE(l.user_id, a.user_id)
ORDER BY total_miles DESC;
