-- ── Jersey Voting System ─────────────────────────────────────────
-- jersey_designs: available jersey designs to vote on (HHH only)
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

-- jersey_votes: one vote per user per year
CREATE TABLE IF NOT EXISTS jersey_votes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  design_id  uuid        NOT NULL REFERENCES jersey_designs(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year       INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT jersey_votes_user_year_unique UNIQUE (user_id, year)
);

-- ── Row Level Security ────────────────────────────────────────────

ALTER TABLE jersey_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jersey_votes   ENABLE ROW LEVEL SECURITY;

-- Public: read active designs
CREATE POLICY "jersey_designs_public_read"
  ON jersey_designs FOR SELECT
  USING (active = TRUE);

-- Public: read votes (needed for counts display)
CREATE POLICY "jersey_votes_public_read"
  ON jersey_votes FOR SELECT
  USING (TRUE);

-- Auth: insert own vote
CREATE POLICY "jersey_votes_auth_insert"
  ON jersey_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Auth: delete own vote (required for change-vote flow)
CREATE POLICY "jersey_votes_auth_delete"
  ON jersey_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role: full access (admin operations)
CREATE POLICY "jersey_designs_service_role"
  ON jersey_designs FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "jersey_votes_service_role"
  ON jersey_votes FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);
