-- Structured city for parking_listings. The owner's address form already
-- derives a city from Google Places (AddressAutocomplete.tsx onSelect.city)
-- but it was only ever folded into the free-text address string - there was
-- no queryable field to filter "all parking in <city>" against, which blocks
-- city-based SEO landing pages. Nullable: existing rows have no real city
-- data to backfill from.

ALTER TABLE parking_listings ADD COLUMN IF NOT EXISTS city VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_parking_listings_city ON parking_listings (LOWER(city));
