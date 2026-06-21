CREATE TABLE IF NOT EXISTS parkings (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  monthly_price INTEGER NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parkings_owner ON parkings(owner_id);
CREATE INDEX idx_parkings_city ON parkings(city);
CREATE INDEX idx_parkings_status ON parkings(status);
