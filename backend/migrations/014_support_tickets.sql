-- Support tickets. The User Portal's "Send us a message" form previously
-- submitted into nothing - no persistence, no admin visibility. This gives
-- it a real destination and lets the user see the admin's reply afterward,
-- so it's a two-way loop rather than a black hole.

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(20) NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
