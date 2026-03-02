-- Sponsor CRM: sponsors, contacts, and interaction log

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE sponsor_status AS ENUM (
  'prospect', 'contacted', 'negotiating', 'committed', 'paid', 'declined'
);

CREATE TYPE sponsor_interaction_type AS ENUM (
  'email', 'call', 'meeting', 'text'
);

-- ─── Sponsors ────────────────────────────────────────────────────────────────

CREATE TABLE sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  name text NOT NULL,
  website text,
  address text,
  status sponsor_status NOT NULL DEFAULT 'prospect',
  expected_amount integer DEFAULT 0,
  committed_amount integer DEFAULT 0,
  notes text,
  next_followup_at timestamptz,
  owner_profile_id uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select sponsors"
  ON sponsors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = sponsors.org_id
    )
  );

CREATE POLICY "Admins can insert sponsors"
  ON sponsors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = sponsors.org_id
    )
  );

CREATE POLICY "Admins can update sponsors"
  ON sponsors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = sponsors.org_id
    )
  );

CREATE POLICY "Admins can delete sponsors"
  ON sponsors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = sponsors.org_id
    )
  );

CREATE INDEX idx_sponsors_org_id ON sponsors(org_id);
CREATE INDEX idx_sponsors_status ON sponsors(org_id, status);
CREATE INDEX idx_sponsors_followup ON sponsors(next_followup_at)
  WHERE next_followup_at IS NOT NULL;

-- ─── Sponsor Contacts ────────────────────────────────────────────────────────

CREATE TABLE sponsor_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sponsor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sponsor_contacts"
  ON sponsor_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sponsors
      JOIN profiles ON profiles.org_id = sponsors.org_id
        AND profiles.id = auth.uid()
        AND profiles.role = 'admin'
      WHERE sponsors.id = sponsor_contacts.sponsor_id
    )
  );

CREATE INDEX idx_sponsor_contacts_sponsor_id ON sponsor_contacts(sponsor_id);

-- ─── Sponsor Interactions ────────────────────────────────────────────────────

CREATE TABLE sponsor_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  type sponsor_interaction_type NOT NULL,
  summary text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sponsor_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sponsor_interactions"
  ON sponsor_interactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sponsors
      JOIN profiles ON profiles.org_id = sponsors.org_id
        AND profiles.id = auth.uid()
        AND profiles.role = 'admin'
      WHERE sponsors.id = sponsor_interactions.sponsor_id
    )
  );

CREATE INDEX idx_sponsor_interactions_sponsor_id
  ON sponsor_interactions(sponsor_id, occurred_at DESC);
