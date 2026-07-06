-- Rename the "driver" role terminology to "user" throughout the schema.
-- The role value and the driver_id foreign key on vehicles/bookings both
-- referred to the same concept (a driver-role account); both are renamed
-- here so the schema doesn't end up with a "user" role stored in columns
-- still called driver_id.

ALTER TYPE user_role RENAME VALUE 'driver' TO 'user';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE vehicles RENAME COLUMN driver_id TO user_id;
ALTER TABLE vehicles RENAME CONSTRAINT vehicles_driver_id_fkey TO vehicles_user_id_fkey;
ALTER INDEX idx_vehicles_driver_id RENAME TO idx_vehicles_user_id;

ALTER TABLE bookings RENAME COLUMN driver_id TO user_id;
ALTER TABLE bookings RENAME CONSTRAINT bookings_driver_id_fkey TO bookings_user_id_fkey;
ALTER INDEX idx_bookings_driver_id RENAME TO idx_bookings_user_id;
