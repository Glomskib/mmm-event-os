-- 00016_social_post_fields.sql
-- Add social publishing fields to approvals table (additive only)

ALTER TABLE approvals
  ADD COLUMN channel_targets jsonb,          -- e.g. {"facebook":true,"tiktok":true}
  ADD COLUMN scheduled_for timestamptz,      -- future publish time (null = immediate)
  ADD COLUMN publish_result jsonb,           -- Late.dev API response payload
  ADD COLUMN published_url text,             -- primary published URL
  ADD COLUMN media_urls text[],              -- image/video URLs already hosted
  ADD COLUMN error_message text;             -- last publish error
