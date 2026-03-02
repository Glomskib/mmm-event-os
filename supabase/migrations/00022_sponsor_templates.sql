-- ============================================================
-- Sponsor email templates
-- ============================================================

CREATE TABLE public.sponsor_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body_markdown text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsor_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_sponsor_email_templates"
  ON public.sponsor_email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.org_id = sponsor_email_templates.org_id
        AND profiles.role = 'admin'
    )
  );

CREATE INDEX idx_sponsor_email_templates_org
  ON public.sponsor_email_templates(org_id, created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_sponsor_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sponsor_email_templates_updated_at
  BEFORE UPDATE ON public.sponsor_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsor_email_templates_updated_at();
