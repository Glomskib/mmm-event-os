-- Seed: Create Wheels & Reels 2026 event
-- Idempotent: will not duplicate if already exists

DO $$
DECLARE
  v_org_id uuid;
  v_event_id uuid;
  v_slug text := 'wheels-and-reels-2026';
BEGIN
  SELECT id INTO v_org_id
    FROM orgs
   WHERE slug = 'making-miles-matter'
   LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Org "making-miles-matter" not found';
  END IF;

  IF EXISTS (SELECT 1 FROM events WHERE slug = v_slug) THEN
    RAISE NOTICE 'Event "%" already exists — skipping', v_slug;
    RETURN;
  END IF;

  INSERT INTO events (
    org_id, title, slug, series_key,
    date, location, description,
    status, registration_open
  ) VALUES (
    v_org_id,
    'Wheels & Reels 2026',
    v_slug,
    'wnr',
    '2026-06-20 18:00:00-04',
    'Findlay, OH',
    'An evening of cycling films, food, and community. Ride in or drive over — enjoy curated cycling documentaries and short films under the stars.',
    'published',
    true
  )
  RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created W&R 2026 event: % (id=%)', v_slug, v_event_id;
END $$;
