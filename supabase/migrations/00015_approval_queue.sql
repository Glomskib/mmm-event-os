-- 00015_approval_queue.sql
-- Approval queue for content that requires admin review before sending

CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  type text NOT NULL,                    -- 'weekly_ride_email', 'social_post', etc.
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'rejected', 'sent', 'scheduled')),
  title text NOT NULL,
  body_json jsonb,                       -- structured payload (rides array, etc.)
  body_html text,                        -- rendered HTML (email body)
  created_by uuid,                       -- null for system-generated (cron)
  approved_by uuid,
  rejected_by uuid,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Admins can read all approvals for their org
CREATE POLICY "approvals_admin_select" ON approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.org_id = approvals.org_id
        AND profiles.role = 'admin'
    )
  );

-- Admins can insert approvals for their org
CREATE POLICY "approvals_admin_insert" ON approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.org_id = approvals.org_id
        AND profiles.role = 'admin'
    )
  );

-- Admins can update approvals for their org
CREATE POLICY "approvals_admin_update" ON approvals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.org_id = approvals.org_id
        AND profiles.role = 'admin'
    )
  );

-- Service role bypass (cron-generated drafts use service role)
-- No explicit policy needed — service role bypasses RLS

-- Indexes
CREATE INDEX idx_approvals_org_status ON approvals(org_id, status);
CREATE INDEX idx_approvals_type ON approvals(type);
CREATE INDEX idx_approvals_created_at ON approvals(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approvals_updated_at
  BEFORE UPDATE ON approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_approvals_updated_at();
