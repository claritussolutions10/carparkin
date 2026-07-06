-- The seeded "driver" test account's email still read driver@carparkin.com
-- after the role rename in 008. Update it to match the new "user" role
-- terminology consistently.

UPDATE users SET email = 'user@carparkin.com' WHERE email = 'driver@carparkin.com';
