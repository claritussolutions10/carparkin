-- Lets an owner block a listing for maintenance over a date range. Booking
-- availability (bookings.service.ts checkAvailability) was purely a function
-- of total_spaces vs overlapping bookings - there was no way for an owner to
-- take a lot offline for a period without deactivating the whole listing.

CREATE TABLE IF NOT EXISTS parking_blackout_dates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  parking_listing_id TEXT NOT NULL REFERENCES parking_listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_blackout_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_blackout_listing_id ON parking_blackout_dates(parking_listing_id);
CREATE INDEX IF NOT EXISTS idx_blackout_dates ON parking_blackout_dates(start_date, end_date);
