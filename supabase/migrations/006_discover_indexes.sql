-- Speed up discover queries

-- Fast date + status filter (the main discover query)
CREATE INDEX IF NOT EXISTS idx_partner_requests_discover
  ON partner_requests (status, date, created_at DESC)
  WHERE status = 'active';

-- Fast user exclusion
CREATE INDEX IF NOT EXISTS idx_partner_requests_user_id
  ON partner_requests (user_id);

-- Fast interests lookup (swiped filter + sent tab)
CREATE INDEX IF NOT EXISTS idx_interests_from_user
  ON interests (from_user_id);

-- Fast inbox lookup (received tab)
CREATE INDEX IF NOT EXISTS idx_interests_to_user
  ON interests (to_user_id);

-- Fast blocks lookup
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks (blocked_id);

-- Trigram index for location search (enables fast ILIKE '%query%')
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_requests_location_trgm
  ON partner_requests USING gin (location_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_home_area_trgm
  ON profiles USING gin (home_area gin_trgm_ops);
