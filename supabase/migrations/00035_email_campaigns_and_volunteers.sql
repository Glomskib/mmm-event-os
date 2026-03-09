-- 00035: Email subscribers, campaigns, sends, and volunteer signups

-- ── Email subscribers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_subscribers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL,
  name            TEXT,
  source          TEXT        NOT NULL DEFAULT 'website',
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_subscribers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS email_subscribers_email_idx ON email_subscribers (email);
CREATE INDEX IF NOT EXISTS email_subscribers_tags_idx ON email_subscribers USING gin (tags);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_all_email_subscribers"
    ON email_subscribers FOR ALL
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow anonymous inserts for newsletter signup
DO $$ BEGIN
  CREATE POLICY "anon_insert_email_subscribers"
    ON email_subscribers FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Email campaigns ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject      TEXT        NOT NULL,
  preview_text TEXT,
  body_html    TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  tags_filter  TEXT[]      NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  total_sent   INTEGER     NOT NULL DEFAULT 0,
  total_opened INTEGER     NOT NULL DEFAULT 0,
  total_clicked INTEGER    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_all_email_campaigns"
    ON email_campaigns FOR ALL
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Email sends (per-recipient tracking) ──────────────────────────
CREATE TABLE IF NOT EXISTS email_sends (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID        NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID        NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at       TIMESTAMPTZ,
  opened_at     TIMESTAMPTZ,
  clicked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_sends_campaign_idx ON email_sends (campaign_id);
CREATE INDEX IF NOT EXISTS email_sends_subscriber_idx ON email_sends (subscriber_id);

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_all_email_sends"
    ON email_sends FOR ALL
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Volunteer signups ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT volunteer_signups_email_unique UNIQUE (email)
);

ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_all_volunteer_signups"
    ON volunteer_signups FOR ALL
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow anonymous inserts for the signup form
DO $$ BEGIN
  CREATE POLICY "anon_insert_volunteer_signups"
    ON volunteer_signups FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
