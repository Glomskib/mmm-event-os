-- Migration: finalize canonical event titles (add year to HHH, ensure org safety)
-- Safe/additive: no deletes, no registrations or raffle_entries touched.
-- Uses org_id filter so multi-tenant orgs are unaffected.

DO $$
DECLARE
  mmm_org_id uuid;
BEGIN
  SELECT id INTO mmm_org_id FROM public.orgs WHERE slug = 'making-miles-matter' LIMIT 1;
  IF mmm_org_id IS NULL THEN RETURN; END IF;

  -- 1. Ensure FFF is correct (catch any variant that 00023 may have missed)
  UPDATE public.events
    SET title = 'Findlay Further Fondo'
    WHERE org_id = mmm_org_id
      AND title IN (
        'Fun Friday Fifty',
        'Findlay Further Fondo',   -- already correct, no-op
        'FFF 2026'
      )
      AND title != 'Findlay Further Fondo';

  -- 2. Append "2026" to HHH (came out of 00023 as "Hancock Horizontal Hundred")
  UPDATE public.events
    SET title = 'Hancock Horizontal Hundred 2026'
    WHERE org_id = mmm_org_id
      AND title IN (
        'Houghton Hundred',
        'Hancock Horizontal Hundred',
        'HHH 2026'
      );

  -- 3. Recompute slugs for all MMM events to stay in sync with updated titles
  UPDATE public.events
    SET slug = REGEXP_REPLACE(
                 REGEXP_REPLACE(
                   LOWER(title),
                   '[^a-z0-9]+', '-', 'g'
                 ),
                 '^-+|-+$', '', 'g'
               )
    WHERE org_id = mmm_org_id;
END;
$$;
