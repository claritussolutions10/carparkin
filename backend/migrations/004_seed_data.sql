-- Seed parking types
INSERT INTO parking_types (name, description) VALUES
  ('Basement', 'Underground parking'),
  ('Ground Level', 'Ground floor parking'),
  ('Open-air', 'Outdoor parking lot'),
  ('Covered', 'Covered parking structure'),
  ('Multi-level', 'Multi-story parking garage');

-- Seed amenities
INSERT INTO amenities (name, description, icon) VALUES
  ('24/7 Surveillance', 'CCTV monitoring 24 hours', '📹'),
  ('EV Charging', 'Electric vehicle charging station', '🔌'),
  ('Security Guard', 'On-site security personnel', '👮'),
  ('Covered Parking', 'Weather protection', '☂️'),
  ('Reserved Spots', 'Dedicated parking space', '🚗'),
  ('Lighting', 'Well-lit parking area', '💡'),
  ('CCTV Enabled', 'Video surveillance', '📷'),
  ('Wheelchair Access', 'Accessible parking', '♿'),
  ('Car Wash', 'On-site washing facility', '🧼'),
  ('Air Conditioning', 'Climate controlled', '❄️');

-- Seed subscription plans
INSERT INTO subscription_plans (name, price, max_listings, currency, features) VALUES
  ('Starter', 29.00, 3, 'USD', '{"analytics": true, "listings": 3, "support": "email"}'),
  ('Gold Tier', 59.00, 10, 'USD', '{"analytics": true, "listings": 10, "support": "priority"}'),
  ('Enterprise', 99.00, NULL, 'USD', '{"analytics": true, "listings": null, "support": "dedicated"}');
