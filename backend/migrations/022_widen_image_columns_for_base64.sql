-- No Cloudinary account is configured for this environment, so uploads now
-- store the image as a base64 data URL directly in Postgres instead of a
-- CDN URL. VARCHAR(500) was sized for short CDN URLs, not base64-encoded
-- image data, so widen every column that holds an uploaded image/document.

ALTER TABLE users ALTER COLUMN profile_picture TYPE TEXT;
ALTER TABLE parking_listing_images ALTER COLUMN cloudinary_url TYPE TEXT;
ALTER TABLE platform_settings ALTER COLUMN logo_url TYPE TEXT;
ALTER TABLE platform_settings ALTER COLUMN hero_image_url TYPE TEXT;
ALTER TABLE owner_settings ALTER COLUMN kyc_document_url TYPE TEXT;
