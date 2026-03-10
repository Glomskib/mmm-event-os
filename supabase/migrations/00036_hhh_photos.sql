-- HHH event photos table
CREATE TABLE IF NOT EXISTS hhh_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug text NOT NULL,
  year smallint NOT NULL,
  category text NOT NULL CHECK (category IN ('hero','ride','rest-stops','finish-line','volunteers','promo')),
  file_path text NOT NULL,
  public_url text NOT NULL,
  alt_text text,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hhh_photos_event ON hhh_photos(event_slug, year);
CREATE INDEX idx_hhh_photos_category ON hhh_photos(category);

-- RLS: public read, service-role write
ALTER TABLE hhh_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON hhh_photos FOR SELECT
  USING (true);

CREATE POLICY "Service role insert"
  ON hhh_photos FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update"
  ON hhh_photos FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role delete"
  ON hhh_photos FOR DELETE
  TO service_role
  USING (true);

