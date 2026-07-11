CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parking_listing_id TEXT NOT NULL REFERENCES parking_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, parking_listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
