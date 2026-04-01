-- Add multi-date support to partner requests
-- dates stores an array of ISO date strings when user picks multiple dates
-- date column remains as the primary (earliest) date for backwards compatibility

ALTER TABLE partner_requests
  ADD COLUMN IF NOT EXISTS dates text[] DEFAULT NULL;

-- Index for array overlap queries (useful for future date range filtering)
CREATE INDEX IF NOT EXISTS idx_partner_requests_dates
  ON partner_requests USING GIN (dates);
