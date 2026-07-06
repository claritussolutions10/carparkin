-- Platform-wide configuration, single source of truth for values that were
-- previously hardcoded or duplicated across modules (commission rate baked
-- into bookings.service.ts, support phone hardcoded in the User Support page,
-- listing-approval default never actually wired up). Single-row table,
-- enforced via the id=1 check constraint - there is exactly one config row.

CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  require_listing_approval BOOLEAN NOT NULL DEFAULT true,
  support_phone VARCHAR(20),
  support_email VARCHAR(255),
  support_hours VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT platform_settings_single_row CHECK (id = 1)
);

INSERT INTO platform_settings (id, commission_rate, require_listing_approval, support_phone, support_email, support_hours)
VALUES (1, 10.00, true, '+91 1800-123-4567', 'support@carparkin.in', '9:00 AM - 9:00 PM IST, all days')
ON CONFLICT (id) DO NOTHING;

-- subscription_plans was seeded with raw USD test values ($29/$59/$99) that
-- were never actually corrected to India-market pricing - fixing that here
-- since this migration makes the table the real, live-managed source of
-- truth for the first time (previously the Owner Portal ignored it entirely
-- and used a hardcoded frontend array instead).
UPDATE subscription_plans SET currency = 'INR', price = 799.00 WHERE name = 'Starter';
UPDATE subscription_plans SET currency = 'INR', price = 1999.00 WHERE name = 'Gold Tier';
UPDATE subscription_plans SET currency = 'INR', price = 4999.00 WHERE name = 'Enterprise';
