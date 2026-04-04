-- Allow interests without a specific request (profile-level connections)
ALTER TABLE interests ALTER COLUMN request_id DROP NOT NULL;

-- Add unique constraint for profile-level connections (where request_id IS NULL)
-- This prevents duplicate "connect" swipes between the same two users
CREATE UNIQUE INDEX interests_profile_connection
  ON interests (from_user_id, to_user_id) WHERE request_id IS NULL;
