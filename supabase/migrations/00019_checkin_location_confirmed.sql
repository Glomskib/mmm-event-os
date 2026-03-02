-- Add self-attestation location confirmation to check-ins
ALTER TABLE checkins ADD COLUMN location_confirmed boolean NOT NULL DEFAULT false;
