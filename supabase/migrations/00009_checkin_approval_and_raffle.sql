-- ============================================================
-- Checkin approval flow + raffle entries
-- ============================================================

-- Add approval column to checkins
ALTER TABLE public.checkins ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Unique constraint: one checkin per user per ride occurrence
ALTER TABLE public.checkins
  ADD CONSTRAINT checkins_unique_user_ride UNIQUE (user_id, ride_occurrence_id);

-- Raffle entry source enum
CREATE TYPE public.raffle_entry_source AS ENUM ('shop_ride', 'referral', 'bonus');

-- Raffle entries table
CREATE TABLE public.raffle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  source public.raffle_entry_source NOT NULL,
  checkin_id uuid REFERENCES public.checkins ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One raffle entry per checkin
ALTER TABLE public.raffle_entries
  ADD CONSTRAINT raffle_entries_unique_checkin UNIQUE (checkin_id);

-- ============================================================
-- RLS on raffle_entries
-- ============================================================
ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;

-- Users can see their own raffle entries
CREATE POLICY "raffle_entries_select_own" ON public.raffle_entries
  FOR SELECT USING (user_id = auth.uid());

-- Admins can see all raffle entries in their org
CREATE POLICY "raffle_entries_select_admin" ON public.raffle_entries
  FOR SELECT USING (public.is_org_admin(org_id));

-- Only admins can insert raffle entries
CREATE POLICY "raffle_entries_insert_admin" ON public.raffle_entries
  FOR INSERT WITH CHECK (public.is_org_admin(org_id));

-- ============================================================
-- Additional RLS on checkins: admin update + delete
-- ============================================================

CREATE POLICY "checkins_update_admin" ON public.checkins
  FOR UPDATE USING (public.is_org_admin(org_id));

CREATE POLICY "checkins_delete_admin" ON public.checkins
  FOR DELETE USING (public.is_org_admin(org_id));

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX raffle_entries_user_id_idx ON public.raffle_entries (user_id);
CREATE INDEX raffle_entries_org_id_idx ON public.raffle_entries (org_id);
CREATE INDEX checkins_ride_occurrence_id_idx ON public.checkins (ride_occurrence_id);
CREATE INDEX checkins_approved_idx ON public.checkins (approved) WHERE approved = true;

-- ============================================================
-- Storage: update insert policy for checkins bucket
-- Drop old user-folder-scoped policy, replace with auth-only
-- (path enforcement handled via signed URLs in API)
-- ============================================================
DROP POLICY IF EXISTS "checkins_storage_insert" ON storage.objects;

CREATE POLICY "checkins_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'checkins'
    AND auth.uid() IS NOT NULL
  );
