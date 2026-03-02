-- Seed: Create HHH 2026 event
-- Safe to run after repair-migrations-23-34.sql
-- Idempotent: will not duplicate if already exists

DO $$
DECLARE
  v_org_id uuid;
  v_event_id uuid;
  v_slug text := 'hancock-horizontal-hundred-2026';
BEGIN
  -- Resolve org
  SELECT id INTO v_org_id
    FROM orgs
   WHERE slug = 'making-miles-matter'
   LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Org "making-miles-matter" not found — check orgs table';
  END IF;

  -- Skip if event already exists (slug is unique)
  IF EXISTS (SELECT 1 FROM events WHERE slug = v_slug) THEN
    RAISE NOTICE 'Event "%" already exists — skipping insert', v_slug;
    RETURN;
  END IF;

  -- Insert the event
  INSERT INTO events (
    org_id,
    title,
    slug,
    series_key,
    date,
    location,
    description,
    status,
    registration_open
  ) VALUES (
    v_org_id,
    'Hancock Horizontal Hundred 2026',
    v_slug,
    'hhh',
    '2026-09-12 07:00:00-04',          -- 7 AM EDT on race day
    'Findlay, OH',
    'The 2026 edition of the Hancock Horizontal Hundred — Ohio''s premier gravel century ride through the flat, fast roads of Hancock County.',
    'published',
    true
  )
  RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created HHH 2026 event: % (id=%)', v_slug, v_event_id;
END $$;
