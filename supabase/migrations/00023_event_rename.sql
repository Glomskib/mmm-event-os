-- Migration: normalize official event names + add stable slug column
-- Guardrails: no deletion, no touch on registrations or raffle_entries

-- 1. Rename events to official names
UPDATE public.events
  SET title = 'Findlay Further Fondo'
  WHERE title ILIKE '%Fun Friday%';

UPDATE public.events
  SET title = 'Hancock Horizontal Hundred'
  WHERE title ILIKE '%Houghton%';

-- 2. Add slug column (idempotent)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug text;

-- 3. Populate slugs for all events using the same logic as TypeScript slugify():
--    lowercase → replace runs of non-alphanumeric chars with '-' → strip leading/trailing '-'
UPDATE public.events
  SET slug = REGEXP_REPLACE(
               REGEXP_REPLACE(
                 LOWER(title),
                 '[^a-z0-9]+', '-', 'g'
               ),
               '^-+|-+$', '', 'g'
             )
  WHERE slug IS NULL;

-- 4. Unique index on slug (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON public.events (slug);
