-- Media Assets: photos, videos, and embeds for events (and future ride/sponsor/page contexts)

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE media_entity_type AS ENUM (
  'event', 'ride_series', 'ride_occurrence', 'sponsor', 'page'
);

CREATE TYPE media_kind AS ENUM (
  'image', 'video', 'embed'
);

CREATE TYPE media_placement AS ENUM (
  'hero', 'gallery', 'section', 'banner'
);

-- ─── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE public.media_assets (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid          NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  entity_type media_entity_type NOT NULL,
  entity_id   uuid          NOT NULL,
  kind        media_kind    NOT NULL,
  placement   media_placement NOT NULL DEFAULT 'gallery',
  title       text,
  caption     text,
  url         text          NOT NULL,
  thumb_url   text,
  sort_order  int           NOT NULL DEFAULT 0,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_media_assets_entity
  ON public.media_assets (org_id, entity_type, entity_id, placement, sort_order);

CREATE INDEX idx_media_assets_active
  ON public.media_assets (org_id, is_active);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_media_assets_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read active assets (event pages use anon key)
CREATE POLICY "media_assets_public_select"
  ON public.media_assets FOR SELECT
  USING (is_active = true);

CREATE POLICY "media_assets_admin_insert"
  ON public.media_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = media_assets.org_id
    )
  );

CREATE POLICY "media_assets_admin_update"
  ON public.media_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = media_assets.org_id
    )
  );

CREATE POLICY "media_assets_admin_delete"
  ON public.media_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.org_id = media_assets.org_id
    )
  );

-- ─── Storage bucket: media (public read) ─────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "media_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media_storage_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "media_storage_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
