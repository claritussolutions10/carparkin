-- Owner KYC/bank verification previously had no submission path at all -
-- owner_settings.kyc_verified and bank_account_verified just sat there with
-- no way for an owner to actually submit anything or an admin to review it.
-- This adds the submitted fields plus a rejection reason per side, so admin
-- can approve or reject with feedback and the owner can resubmit.

ALTER TABLE owner_settings
  ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS kyc_document_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS kyc_rejected_reason VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(34),
  ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(11),
  ADD COLUMN IF NOT EXISTS bank_account_holder_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_submitted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS bank_rejected_reason VARCHAR(255);
