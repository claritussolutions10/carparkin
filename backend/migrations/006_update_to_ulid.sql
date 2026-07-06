-- Convert all UUID primary/foreign keys to TEXT for ULID+prefix support
-- Must drop views and FK constraints first, then alter, then recreate.

BEGIN;

-- 1. Drop views that reference UUID columns
DROP VIEW IF EXISTS available_parking_spots;
DROP VIEW IF EXISTS owner_dashboard_summary;

-- 2. Drop all foreign key constraints on UUID columns
ALTER TABLE parking_listings         DROP CONSTRAINT parking_listings_owner_id_fkey;
ALTER TABLE parking_listing_amenities DROP CONSTRAINT parking_listing_amenities_parking_listing_id_fkey;
ALTER TABLE parking_listing_images   DROP CONSTRAINT parking_listing_images_parking_listing_id_fkey;
ALTER TABLE parking_listing_images   DROP CONSTRAINT parking_listing_images_uploaded_by_fkey;
ALTER TABLE vehicles                 DROP CONSTRAINT vehicles_driver_id_fkey;
ALTER TABLE bookings                 DROP CONSTRAINT bookings_driver_id_fkey;
ALTER TABLE bookings                 DROP CONSTRAINT bookings_parking_listing_id_fkey;
ALTER TABLE bookings                 DROP CONSTRAINT bookings_vehicle_id_fkey;
ALTER TABLE reviews                  DROP CONSTRAINT reviews_parking_listing_id_fkey;
ALTER TABLE reviews                  DROP CONSTRAINT reviews_booking_id_fkey;
ALTER TABLE reviews                  DROP CONSTRAINT reviews_reviewer_id_fkey;
ALTER TABLE owner_earnings           DROP CONSTRAINT owner_earnings_owner_id_fkey;
ALTER TABLE owner_earnings           DROP CONSTRAINT owner_earnings_booking_id_fkey;
ALTER TABLE owner_settings           DROP CONSTRAINT owner_settings_owner_id_fkey;
ALTER TABLE user_subscriptions       DROP CONSTRAINT user_subscriptions_owner_id_fkey;

-- 3. Alter all UUID primary keys to TEXT
ALTER TABLE users               ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;
ALTER TABLE parking_listings    ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;
ALTER TABLE parking_listing_images ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;
ALTER TABLE vehicles            ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;
ALTER TABLE bookings            ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;
ALTER TABLE reviews             ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;
ALTER TABLE owner_earnings      ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;

-- 4. Alter all UUID foreign key columns to TEXT
ALTER TABLE parking_listings         ALTER COLUMN owner_id            SET DATA TYPE TEXT USING owner_id::TEXT;
ALTER TABLE parking_listing_amenities ALTER COLUMN parking_listing_id  SET DATA TYPE TEXT USING parking_listing_id::TEXT;
ALTER TABLE parking_listing_images   ALTER COLUMN parking_listing_id   SET DATA TYPE TEXT USING parking_listing_id::TEXT;
ALTER TABLE parking_listing_images   ALTER COLUMN uploaded_by          SET DATA TYPE TEXT USING uploaded_by::TEXT;
ALTER TABLE vehicles                 ALTER COLUMN driver_id             SET DATA TYPE TEXT USING driver_id::TEXT;
ALTER TABLE bookings                 ALTER COLUMN driver_id             SET DATA TYPE TEXT USING driver_id::TEXT;
ALTER TABLE bookings                 ALTER COLUMN parking_listing_id    SET DATA TYPE TEXT USING parking_listing_id::TEXT;
ALTER TABLE bookings                 ALTER COLUMN vehicle_id            SET DATA TYPE TEXT USING vehicle_id::TEXT;
ALTER TABLE reviews                  ALTER COLUMN parking_listing_id    SET DATA TYPE TEXT USING parking_listing_id::TEXT;
ALTER TABLE reviews                  ALTER COLUMN booking_id            SET DATA TYPE TEXT USING booking_id::TEXT;
ALTER TABLE reviews                  ALTER COLUMN reviewer_id           SET DATA TYPE TEXT USING reviewer_id::TEXT;
ALTER TABLE owner_earnings           ALTER COLUMN owner_id              SET DATA TYPE TEXT USING owner_id::TEXT;
ALTER TABLE owner_earnings           ALTER COLUMN booking_id            SET DATA TYPE TEXT USING booking_id::TEXT;
ALTER TABLE owner_settings           ALTER COLUMN owner_id              SET DATA TYPE TEXT USING owner_id::TEXT;
ALTER TABLE user_subscriptions       ALTER COLUMN owner_id              SET DATA TYPE TEXT USING owner_id::TEXT;

-- 5. Recreate foreign key constraints
ALTER TABLE parking_listings          ADD CONSTRAINT parking_listings_owner_id_fkey                    FOREIGN KEY (owner_id)            REFERENCES users(id)             ON DELETE CASCADE;
ALTER TABLE parking_listing_amenities ADD CONSTRAINT parking_listing_amenities_parking_listing_id_fkey FOREIGN KEY (parking_listing_id)  REFERENCES parking_listings(id)  ON DELETE CASCADE;
ALTER TABLE parking_listing_images    ADD CONSTRAINT parking_listing_images_parking_listing_id_fkey    FOREIGN KEY (parking_listing_id)  REFERENCES parking_listings(id)  ON DELETE CASCADE;
ALTER TABLE parking_listing_images    ADD CONSTRAINT parking_listing_images_uploaded_by_fkey           FOREIGN KEY (uploaded_by)         REFERENCES users(id);
ALTER TABLE vehicles                  ADD CONSTRAINT vehicles_driver_id_fkey                           FOREIGN KEY (driver_id)           REFERENCES users(id)             ON DELETE CASCADE;
ALTER TABLE bookings                  ADD CONSTRAINT bookings_driver_id_fkey                           FOREIGN KEY (driver_id)           REFERENCES users(id)             ON DELETE CASCADE;
ALTER TABLE bookings                  ADD CONSTRAINT bookings_parking_listing_id_fkey                  FOREIGN KEY (parking_listing_id)  REFERENCES parking_listings(id);
ALTER TABLE bookings                  ADD CONSTRAINT bookings_vehicle_id_fkey                          FOREIGN KEY (vehicle_id)          REFERENCES vehicles(id);
ALTER TABLE reviews                   ADD CONSTRAINT reviews_parking_listing_id_fkey                   FOREIGN KEY (parking_listing_id)  REFERENCES parking_listings(id)  ON DELETE CASCADE;
ALTER TABLE reviews                   ADD CONSTRAINT reviews_booking_id_fkey                           FOREIGN KEY (booking_id)          REFERENCES bookings(id)          ON DELETE CASCADE;
ALTER TABLE reviews                   ADD CONSTRAINT reviews_reviewer_id_fkey                          FOREIGN KEY (reviewer_id)         REFERENCES users(id)             ON DELETE CASCADE;
ALTER TABLE owner_earnings            ADD CONSTRAINT owner_earnings_owner_id_fkey                      FOREIGN KEY (owner_id)            REFERENCES users(id)             ON DELETE CASCADE;
ALTER TABLE owner_earnings            ADD CONSTRAINT owner_earnings_booking_id_fkey                    FOREIGN KEY (booking_id)          REFERENCES bookings(id);
ALTER TABLE owner_settings            ADD CONSTRAINT owner_settings_owner_id_fkey                      FOREIGN KEY (owner_id)            REFERENCES users(id)             ON DELETE CASCADE;
ALTER TABLE user_subscriptions        ADD CONSTRAINT user_subscriptions_owner_id_fkey                  FOREIGN KEY (owner_id)            REFERENCES users(id)             ON DELETE CASCADE;

-- 6. Recreate views
CREATE VIEW available_parking_spots AS
SELECT
  pl.id,
  pl.title,
  pl.address,
  pl.latitude,
  pl.longitude,
  pl.total_spaces,
  pl.available_spaces,
  pl.price_per_month,
  pl.rating,
  u.full_name AS owner_name,
  pt.name AS parking_type,
  COUNT(DISTINCT pla.amenity_id) AS amenity_count
FROM parking_listings pl
LEFT JOIN users u ON pl.owner_id = u.id
LEFT JOIN parking_types pt ON pl.parking_type_id = pt.id
LEFT JOIN parking_listing_amenities pla ON pl.id = pla.parking_listing_id
WHERE pl.is_active = true AND pl.is_approved = true
GROUP BY pl.id, u.id, pt.id;

CREATE VIEW owner_dashboard_summary AS
SELECT
  u.id AS owner_id,
  u.full_name,
  COUNT(DISTINCT pl.id) AS total_listings,
  COALESCE(SUM(pl.total_spaces), 0) AS total_spaces,
  COALESCE(SUM(pl.available_spaces), 0) AS available_spaces,
  COUNT(DISTINCT b.id) AS total_bookings,
  COALESCE(SUM(oe.net_amount), 0) AS total_earnings,
  us.plan_id,
  sp.name AS current_plan
FROM users u
LEFT JOIN parking_listings pl ON u.id = pl.owner_id
LEFT JOIN bookings b ON pl.id = b.parking_listing_id
LEFT JOIN owner_earnings oe ON u.id = oe.owner_id
LEFT JOIN user_subscriptions us ON u.id = us.owner_id AND us.status = 'active'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE u.role = 'owner'
GROUP BY u.id, us.plan_id, sp.name;

COMMIT;
