-- Set all three seeded test accounts' password to "123" for local dev convenience.
-- Hash generated with bcryptjs, 12 rounds (same as auth.service.ts signup flow).

UPDATE users
SET password_hash = '$2b$12$HbEyKhwXGimXkhoRfdZJWe.lS5QtQRidJxD5rGbGjYXQDGkoXKape'
WHERE email IN ('user@carparkin.com', 'owner@carparkin.com', 'admin@carparkin.com');
