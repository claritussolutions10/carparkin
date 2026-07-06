-- ============================================================================
-- TEST DATA - USERS (Admin, Owner, Driver)
-- ============================================================================

INSERT INTO users (id, email, password_hash, full_name, phone_number, role, is_active, is_email_verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@carparkin.com',
  '$2b$10$ZrzRbGqLICsBkddPpiqZ8.ErRHzQvReCEvABtcZWRSiuyceRi0HSG',
  'Admin User',
  '+919876543210',
  'admin',
  true,
  true
);

INSERT INTO users (id, email, password_hash, full_name, phone_number, role, is_active, is_email_verified)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'owner@carparkin.com',
  '$2b$10$l2uFevlzIk5/PjTBBYp0.OzF4YdZ7hCbDC4SvVdnycqiCiQpaz3tu',
  'Parking Owner',
  '+919876543211',
  'owner',
  true,
  true
);

INSERT INTO users (id, email, password_hash, full_name, phone_number, role, is_active, is_email_verified)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'driver@carparkin.com',
  '$2b$10$Z1dI4asOxxn9MotvqeGMNO2IU0QFS4JxhUADBwjBeDWWIA5wwLNLq',
  'John Doe',
  '+919876543212',
  'driver',
  true,
  true
);

-- ============================================================================
-- OWNER SETTINGS
-- ============================================================================

INSERT INTO owner_settings (owner_id, requires_listing_approval, listing_approval_status, kyc_verified, bank_account_verified)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  false,
  'approved',
  true,
  true
);

-- ============================================================================
-- OWNER SUBSCRIPTION
-- ============================================================================

INSERT INTO user_subscriptions (owner_id, plan_id, status, start_date, end_date, is_auto_renew)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  2,
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year',
  true
);

-- ============================================================================
-- PARKING LISTINGS (by Owner)
-- ============================================================================

INSERT INTO parking_listings (
  id, owner_id, parking_type_id, title, description, address,
  latitude, longitude, total_spaces, available_spaces,
  price_per_month, price_per_week, price_per_day,
  has_cctv, has_security_guard, access_type, is_approved, is_active
)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  1,
  'Downtown Secure Parking',
  'Premium underground parking in the heart of the city. Safe, secure, and well-maintained.',
  '123 Main Street, Downtown',
  28.70410000,
  77.10250000,
  20,
  18,
  3000.00,
  800.00,
  150.00,
  true,
  true,
  '24/7',
  true,
  true
);

INSERT INTO parking_listings (
  id, owner_id, parking_type_id, title, description, address,
  latitude, longitude, total_spaces, available_spaces,
  price_per_month, price_per_week, price_per_day,
  has_cctv, has_security_guard, access_type, is_approved, is_active
)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  3,
  'Airport Long Term Parking',
  'Convenient parking near airport terminal. Perfect for long-term parking.',
  '456 Airport Road',
  28.57210000,
  77.11000000,
  50,
  35,
  2500.00,
  700.00,
  120.00,
  true,
  false,
  'Business hours',
  true,
  true
);

-- ============================================================================
-- PARKING LISTING AMENITIES
-- ============================================================================

INSERT INTO parking_listing_amenities (parking_listing_id, amenity_id)
VALUES
  ('10000000-0000-0000-0000-000000000001', 1),
  ('10000000-0000-0000-0000-000000000001', 3),
  ('10000000-0000-0000-0000-000000000001', 6),
  ('10000000-0000-0000-0000-000000000001', 8);

INSERT INTO parking_listing_amenities (parking_listing_id, amenity_id)
VALUES
  ('10000000-0000-0000-0000-000000000002', 1),
  ('10000000-0000-0000-0000-000000000002', 2),
  ('10000000-0000-0000-0000-000000000002', 7),
  ('10000000-0000-0000-0000-000000000002', 9);

-- ============================================================================
-- VEHICLES (Driver's vehicles)
-- ============================================================================

INSERT INTO vehicles (
  id, driver_id, vehicle_type, registration_number,
  make, model, color, year_manufactured, is_primary, is_active
)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'car',
  'DL-01-AB-1234',
  'Toyota',
  'Camry',
  'Silver',
  2022,
  true,
  true
);

INSERT INTO vehicles (
  id, driver_id, vehicle_type, registration_number,
  make, model, color, year_manufactured, is_primary, is_active
)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'car',
  'DL-01-CD-5678',
  'Honda',
  'Civic',
  'Blue',
  2021,
  false,
  true
);

-- ============================================================================
-- BOOKINGS
-- ============================================================================

INSERT INTO bookings (
  id, driver_id, parking_listing_id, vehicle_id,
  booking_start_date, booking_end_date, duration_days, duration_type,
  total_price, platform_commission, owner_payout,
  status, payment_status
)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  30,
  'month',
  3000.00,
  300.00,
  2700.00,
  'confirmed',
  'completed'
);

INSERT INTO bookings (
  id, driver_id, parking_listing_id, vehicle_id,
  booking_start_date, booking_end_date, duration_days, duration_type,
  total_price, platform_commission, owner_payout,
  status, payment_status
)
VALUES (
  '30000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  CURRENT_DATE + INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '12 days',
  7,
  'week',
  700.00,
  70.00,
  630.00,
  'pending',
  'pending'
);

-- ============================================================================
-- REVIEWS (for completed booking only)
-- ============================================================================

INSERT INTO reviews (
  id, parking_listing_id, booking_id, reviewer_id,
  rating, review_text, cleanliness_rating, security_rating, accessibility_rating,
  is_verified_booking
)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  5,
  'Excellent parking spot! Very secure and well-maintained. Highly recommended!',
  5,
  5,
  4,
  true
);

-- ============================================================================
-- UPDATE PARKING LISTING RATINGS
-- ============================================================================

UPDATE parking_listings SET
  rating = 5.00,
  review_count = 1
WHERE id = '10000000-0000-0000-0000-000000000001';

-- ============================================================================
-- OWNER EARNINGS (from completed booking)
-- ============================================================================

INSERT INTO owner_earnings (
  id, owner_id, booking_id,
  gross_amount, commission_amount, net_amount, status
)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000001',
  3000.00,
  300.00,
  2700.00,
  'paid'
);
