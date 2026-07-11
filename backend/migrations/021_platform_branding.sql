-- Site branding (logo + homepage hero image) - previously there was no way to
-- set these at all; the public header and homepage hero were hardcoded to an
-- icon/text mark and an SVG illustration. Nullable by design: until an admin
-- uploads something, the frontend keeps its existing icon/illustration
-- fallback rather than breaking.

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS hero_image_url VARCHAR(500);
