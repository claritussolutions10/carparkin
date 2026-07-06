-- Lets an owner reply publicly to a review on their own listing. Reviews had
-- no owner-facing surface at all before this - owners couldn't even see
-- reviews on their listings, let alone respond to one.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS owner_reply TEXT,
  ADD COLUMN IF NOT EXISTS owner_replied_at TIMESTAMP;
