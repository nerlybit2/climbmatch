-- Remove climbing_type from partner_requests; remove climbing_types from profiles
ALTER TABLE partner_requests DROP COLUMN IF EXISTS climbing_type;
ALTER TABLE profiles DROP COLUMN IF EXISTS climbing_types;
