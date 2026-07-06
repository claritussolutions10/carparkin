-- Carparkin.in Database Schema
-- PostgreSQL with dynamic types, amenities, and subscription plans
-- Replaces old users/parkings tables with full normalized schema

-- ============================================================================
-- DROP OLD TABLES (from initial prototype)
-- ============================================================================

DROP TABLE IF EXISTS parkings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old enums if they exist from a previous run of this migration
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('driver', 'owner', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users (Drivers, Owners, Admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  profile_picture VARCHAR(500),
  role user_role NOT NULL DEFAULT 'driver',
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================================
-- OWNER CONFIGURATION
-- ============================================================================

CREATE TABLE parking_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  max_listings INTEGER,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE owner_settings (
  id SERIAL PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  requires_listing_approval BOOLEAN DEFAULT false,
  listing_approval_status approval_status DEFAULT 'approved',
  kyc_verified BOOLEAN DEFAULT false,
  bank_account_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_owner_settings_owner_id ON owner_settings(owner_id);

-- ============================================================================
-- SUBSCRIPTION MANAGEMENT
-- ============================================================================

CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status subscription_status DEFAULT 'active',
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  razorpay_subscription_id VARCHAR(255),
  is_auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_owner_id ON user_subscriptions(owner_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);

-- ============================================================================
-- PARKING LISTINGS
-- ============================================================================

CREATE TABLE parking_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parking_type_id INTEGER NOT NULL REFERENCES parking_types(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  total_spaces INTEGER NOT NULL,
  available_spaces INTEGER NOT NULL,
  price_per_month DECIMAL(10, 2) NOT NULL,
  price_per_week DECIMAL(10, 2),
  price_per_day DECIMAL(10, 2),

  has_cctv BOOLEAN DEFAULT false,
  has_security_guard BOOLEAN DEFAULT false,
  access_type VARCHAR(50),

  is_approved BOOLEAN DEFAULT true,
  approval_status approval_status DEFAULT 'approved',
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_spaces CHECK (total_spaces > 0 AND available_spaces >= 0)
);

CREATE INDEX idx_parking_owner_id ON parking_listings(owner_id);
CREATE INDEX idx_parking_type_id ON parking_listings(parking_type_id);
CREATE INDEX idx_parking_is_active ON parking_listings(is_active);
CREATE INDEX idx_parking_location ON parking_listings(latitude, longitude);
CREATE INDEX idx_parking_price ON parking_listings(price_per_month);

CREATE TABLE parking_listing_amenities (
  id SERIAL PRIMARY KEY,
  parking_listing_id UUID NOT NULL REFERENCES parking_listings(id) ON DELETE CASCADE,
  amenity_id INTEGER NOT NULL REFERENCES amenities(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(parking_listing_id, amenity_id)
);

CREATE INDEX idx_listing_amenities_parking_id ON parking_listing_amenities(parking_listing_id);
CREATE INDEX idx_listing_amenities_amenity_id ON parking_listing_amenities(amenity_id);

CREATE TABLE parking_listing_images (
  id SERIAL PRIMARY KEY,
  parking_listing_id UUID NOT NULL REFERENCES parking_listings(id) ON DELETE CASCADE,
  cloudinary_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  alt_text VARCHAR(255),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_images_parking_id ON parking_listing_images(parking_listing_id);

-- ============================================================================
-- VEHICLES
-- ============================================================================

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) NOT NULL,
  registration_number VARCHAR(20) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  color VARCHAR(50),
  year_manufactured INTEGER,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);

-- ============================================================================
-- BOOKINGS
-- ============================================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parking_listing_id UUID NOT NULL REFERENCES parking_listings(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),

  booking_start_date DATE NOT NULL,
  booking_end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  duration_type VARCHAR(20),

  total_price DECIMAL(10, 2) NOT NULL,
  platform_commission DECIMAL(10, 2),
  owner_payout DECIMAL(10, 2),

  status booking_status DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_dates CHECK (booking_end_date > booking_start_date)
);

CREATE INDEX idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX idx_bookings_parking_id ON bookings(parking_listing_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(booking_start_date, booking_end_date);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_listing_id UUID NOT NULL REFERENCES parking_listings(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL,
  review_text TEXT,
  cleanliness_rating INTEGER,
  security_rating INTEGER,
  accessibility_rating INTEGER,

  is_verified_booking BOOLEAN DEFAULT true,
  is_helpful_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT valid_sub_ratings CHECK (
    (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5))
    AND (security_rating IS NULL OR (security_rating >= 1 AND security_rating <= 5))
    AND (accessibility_rating IS NULL OR (accessibility_rating >= 1 AND accessibility_rating <= 5))
  )
);

CREATE INDEX idx_reviews_parking_id ON reviews(parking_listing_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================================================
-- OWNER EARNINGS & PAYOUTS
-- ============================================================================

CREATE TABLE owner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id),

  gross_amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,

  status VARCHAR(20) DEFAULT 'pending',
  transaction_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_earnings_owner_id ON owner_earnings(owner_id);
CREATE INDEX idx_earnings_status ON owner_earnings(status);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

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
  u.full_name as owner_name,
  pt.name as parking_type,
  COUNT(DISTINCT pla.amenity_id) as amenity_count
FROM parking_listings pl
LEFT JOIN users u ON pl.owner_id = u.id
LEFT JOIN parking_types pt ON pl.parking_type_id = pt.id
LEFT JOIN parking_listing_amenities pla ON pl.id = pla.parking_listing_id
WHERE pl.is_active = true AND pl.is_approved = true
GROUP BY pl.id, u.id, pt.id;

CREATE VIEW owner_dashboard_summary AS
SELECT
  u.id as owner_id,
  u.full_name,
  COUNT(DISTINCT pl.id) as total_listings,
  COALESCE(SUM(pl.total_spaces), 0) as total_spaces,
  COALESCE(SUM(pl.available_spaces), 0) as available_spaces,
  COUNT(DISTINCT b.id) as total_bookings,
  COALESCE(SUM(oe.net_amount), 0) as total_earnings,
  us.plan_id,
  sp.name as current_plan
FROM users u
LEFT JOIN parking_listings pl ON u.id = pl.owner_id
LEFT JOIN bookings b ON pl.id = b.parking_listing_id
LEFT JOIN owner_earnings oe ON u.id = oe.owner_id
LEFT JOIN user_subscriptions us ON u.id = us.owner_id AND us.status = 'active'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE u.role = 'owner'
GROUP BY u.id, us.plan_id, sp.name;
