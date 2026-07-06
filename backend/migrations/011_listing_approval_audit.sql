-- Adds real fields to track rejection reasons and approval/rejection timestamps.
-- The admin approve/reject flow previously only touched is_approved/is_active and
-- never set approval_status, so a rejected listing was indistinguishable from a
-- still-pending one (both showed is_approved = false). This fixes that and adds
-- the audit fields the Pending Approvals page needs for its stat cards.

ALTER TABLE parking_listings
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(50),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
