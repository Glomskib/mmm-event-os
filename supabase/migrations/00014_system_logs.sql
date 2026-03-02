-- System logs for cron execution tracking and observability
-- DO NOT log PII (no emails, names, user IDs)

CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  message text NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by type + recency
CREATE INDEX idx_system_logs_type_created ON public.system_logs (type, created_at DESC);

-- Auto-cleanup: keep last 90 days only (run manually or via cron)
-- No RLS needed — only accessed via service-role admin client
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can read system_logs"
  ON public.system_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Service-role inserts (no user-facing insert policy needed)
