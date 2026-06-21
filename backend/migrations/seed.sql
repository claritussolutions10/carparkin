-- Dev seed data — run after migrations: psql -d carparkin -f migrations/seed.sql
-- All user passwords: password123

TRUNCATE TABLE parkings, users RESTART IDENTITY CASCADE;

INSERT INTO users (name, email, password, phone, role) VALUES
  ('Suresh Reddy',  'suresh@example.com', '$2b$12$YyolvqoiCigKim0bsxzhi.zCkdAuXzahHsO3MP/XMSUdcEu8Y5in6', '9876543210', 'user'),
  ('Lakshmi Iyer',  'lakshmi@example.com','$2b$12$YyolvqoiCigKim0bsxzhi.zCkdAuXzahHsO3MP/XMSUdcEu8Y5in6', '9876543211', 'user'),
  ('Arun Kumar',    'arun@example.com',   '$2b$12$YyolvqoiCigKim0bsxzhi.zCkdAuXzahHsO3MP/XMSUdcEu8Y5in6', '9876543212', 'user'),
  ('Priya Sharma',  'priya@example.com',  '$2b$12$YyolvqoiCigKim0bsxzhi.zCkdAuXzahHsO3MP/XMSUdcEu8Y5in6', '9876543213', 'user');

-- Suresh (id=1) owns 3 parkings, Lakshmi (id=2) owns 2
INSERT INTO parkings (owner_id, title, description, address, city, monthly_price, capacity, amenities, images, status) VALUES
  (1, 'Anna Nagar Covered Parking',
   'Secure covered parking with 24/7 CCTV and night security. Located in a quiet residential area with easy access from 2nd Avenue.',
   '12, 2nd Avenue, Anna Nagar', 'Chennai', 3000, 25,
   ARRAY['CCTV', 'Covered', 'Security Guard', 'Well Lit'], '{}', 'active'),

  (1, 'Velachery Open Lot',
   'Spacious open-air parking near the IT corridor. Well-lit with marked bays and a dedicated entry/exit lane.',
   '45, Velachery Main Road', 'Chennai', 2200, 40,
   ARRAY['CCTV', '24/7 Access'], '{}', 'active'),

  (1, 'Bandra Multi-Level Parking',
   'Multi-level covered facility with elevator access and reserved spots. Walking distance to Linking Road shopping.',
   'Linking Road, Bandra West', 'Mumbai', 5500, 50,
   ARRAY['CCTV', 'Covered', 'Security Guard', 'EV Charging'], '{}', 'active'),

  (2, 'Koramangala Premium Parking',
   'Premium covered parking in the heart of Koramangala 8th Block. EV charging stations available.',
   '8th Block, Koramangala', 'Bangalore', 4500, 15,
   ARRAY['CCTV', 'Covered', 'EV Charging', 'Well Lit'], '{}', 'active'),

  (2, 'Indiranagar Street Parking',
   'Affordable open parking just 2 minutes from Indiranagar metro station. Perfect for daily commuters.',
   '100 Ft Road, Indiranagar', 'Bangalore', 1800, 30,
   ARRAY['Near Metro', '24/7 Access', 'Well Lit'], '{}', 'active');
