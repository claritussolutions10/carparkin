-- Real Razorpay integration replaces the mocked payment flow. razorpay_order_id
-- and razorpay_payment_id already existed (migration 003) but were never set
-- by real API calls; razorpay_signature is new (needed to persist proof of
-- the verified checkout), and refund_id/refund_status support cancelling a
-- paid booking before it starts.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20);
