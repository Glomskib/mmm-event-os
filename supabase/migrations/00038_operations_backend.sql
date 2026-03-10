-- ============================================================
-- Migration 00038: Full nonprofit event operations backend
-- Adds: rider info fields, event goals, volunteer assignments,
--   sponsor deliverables, logistics, incidents, tasks,
--   activity log, attribution, financial summaries, executive notes
-- ============================================================

-- ── 1. Extend registrations with rider info ──────────────────
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS medical_info text,
  ADD COLUMN IF NOT EXISTS shirt_size text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text,
  ADD COLUMN IF NOT EXISTS skill_level text,
  ADD COLUMN IF NOT EXISTS age_group text,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS packet_picked_up boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;

-- ── 2. Extend events with goals and operational fields ───────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'ride',
  ADD COLUMN IF NOT EXISTS fundraising_goal integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rider_goal integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sponsor_goal integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volunteer_goal integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weather_notes text,
  ADD COLUMN IF NOT EXISTS post_event_notes text,
  ADD COLUMN IF NOT EXISTS venue_details text,
  ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── 3. Extend sponsors with fulfillment tracking ─────────────
ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS in_kind_value integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS logo_received boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assets_received boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS renewal_likelihood text,
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── 4. Extend donations with attribution ─────────────────────
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id),
  ADD COLUMN IF NOT EXISTS campaign_id uuid,
  ADD COLUMN IF NOT EXISTS recurring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS net_amount integer,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS notes text;

-- ── 5. Extend volunteer_signups with operational fields ──────
ALTER TABLE volunteer_signups
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES orgs(id),
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS shirt_size text,
  ADD COLUMN IF NOT EXISTS training_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reliability_notes text,
  ADD COLUMN IF NOT EXISTS total_hours numeric(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- ── 6. Sponsorship deliverables ──────────────────────────────
CREATE TABLE IF NOT EXISTS sponsorship_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  sponsor_id uuid NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id),
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 7. Volunteer assignments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  volunteer_id uuid NOT NULL REFERENCES volunteer_signups(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id),
  role text NOT NULL,
  shift_start timestamptz,
  shift_end timestamptz,
  location text,
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  hours_served numeric(5,1) DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 8. Aid stations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aid_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid NOT NULL REFERENCES events(id),
  name text NOT NULL,
  location text,
  mile_marker numeric(5,1),
  captain_name text,
  captain_phone text,
  water_gallons integer DEFAULT 0,
  food_items text,
  medical_kit boolean DEFAULT false,
  status text NOT NULL DEFAULT 'planned',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 9. SAG assignments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid NOT NULL REFERENCES events(id),
  driver_name text NOT NULL,
  driver_phone text,
  vehicle_description text,
  zone text,
  radio_channel text,
  status text NOT NULL DEFAULT 'standby',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 10. Incident reports ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid REFERENCES events(id),
  reported_by uuid REFERENCES profiles(id),
  severity text NOT NULL DEFAULT 'low',
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  description text,
  location text,
  rider_name text,
  rider_email text,
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 11. Event logistics items (checklist) ────────────────────
CREATE TABLE IF NOT EXISTS event_logistics_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid NOT NULL REFERENCES events(id),
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  assigned_to text,
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  completed_at timestamptz,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 12. Tasks (coordinator task tracking) ────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid REFERENCES events(id),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  completed_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 13. Activity log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  actor_id uuid REFERENCES profiles(id),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 14. Attribution events ───────────────────────────────────
CREATE TABLE IF NOT EXISTS attribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  source text NOT NULL,
  medium text,
  campaign text,
  referrer text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 15. Executive notes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS executive_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid REFERENCES events(id),
  author_id uuid REFERENCES profiles(id),
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text,
  pinned boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 16. Financial summary (per-event P&L) ────────────────────
CREATE TABLE IF NOT EXISTS financial_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id),
  event_id uuid REFERENCES events(id),
  period text,
  gross_registration_revenue integer DEFAULT 0,
  net_registration_revenue integer DEFAULT 0,
  sponsor_revenue integer DEFAULT 0,
  donation_revenue integer DEFAULT 0,
  merch_revenue integer DEFAULT 0,
  in_kind_value integer DEFAULT 0,
  total_expenses integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, event_id, period)
);

-- ── 17. Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sponsorship_deliverables_sponsor ON sponsorship_deliverables(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_deliverables_event ON sponsorship_deliverables(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_event ON volunteer_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_volunteer ON volunteer_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_aid_stations_event ON aid_stations(event_id);
CREATE INDEX IF NOT EXISTS idx_sag_assignments_event ON sag_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_event ON incident_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_event_logistics_items_event ON event_logistics_items(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_event ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_entity ON attribution_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_financial_summary_org ON financial_summary(org_id);

-- ── 18. RLS ──────────────────────────────────────────────────
ALTER TABLE sponsorship_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logistics_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_summary ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (service role bypasses RLS)
CREATE POLICY admin_sponsorship_deliverables ON sponsorship_deliverables FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_volunteer_assignments ON volunteer_assignments FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_aid_stations ON aid_stations FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_sag_assignments ON sag_assignments FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_incident_reports ON incident_reports FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_event_logistics_items ON event_logistics_items FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_tasks ON tasks FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_activity_log ON activity_log FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_attribution_events ON attribution_events FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_executive_notes ON executive_notes FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
CREATE POLICY admin_financial_summary ON financial_summary FOR ALL USING (org_id = get_my_org_id() AND is_org_admin(org_id));
