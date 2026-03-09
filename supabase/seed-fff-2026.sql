-- Seed: Create Findlay Further Fondo 2026 event
-- Idempotent: will not duplicate if already exists

DO $$
DECLARE
  v_org_id uuid;
  v_event_id uuid;
  v_slug text := 'findlay-further-fondo-2026';
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
    'Findlay Further Fondo 2026',
    v_slug,
    'fff',
    '2026-04-25 08:00:00-04',
    'Findlay, OH',
    'A spring gravel fondo through the scenic backroads of Hancock County. Multiple distances for every level — from a casual 25-mile cruise to a challenging metric century.',
    'published',
    true
  )
  RETURNING id INTO v_event_id;

  RAISE NOTICE 'Created FFF 2026 event: % (id=%)', v_slug, v_event_id;
END $$;
