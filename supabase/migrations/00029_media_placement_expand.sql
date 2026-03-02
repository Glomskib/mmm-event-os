-- Migration 00029: Expand media_placement enum with new values for immersive event pages
-- New placements: hero_secondary, route_preview, testimonial, inline_section,
--                 background_loop, sponsor_showcase

ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'hero_secondary';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'route_preview';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'testimonial';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'inline_section';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'background_loop';
ALTER TYPE media_placement ADD VALUE IF NOT EXISTS 'sponsor_showcase';
