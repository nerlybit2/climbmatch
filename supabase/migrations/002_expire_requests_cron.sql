-- Enable pg_cron extension (must be enabled in Supabase dashboard first)
-- Go to Database > Extensions > enable pg_cron

-- Schedule expire_old_requests() to run every hour
-- Note: pg_cron must be enabled in Supabase dashboard before running this
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire-old-requests',
      '0 * * * *',  -- every hour
      $$SELECT expire_old_requests()$$
    );
  END IF;
END
$$;

-- Fallback: trigger expiration on writes to partner_requests
-- Runs probabilistically (~1% of writes) to avoid overhead
CREATE OR REPLACE FUNCTION expire_requests_on_write()
RETURNS TRIGGER AS $$
BEGIN
  IF random() < 0.01 THEN
    PERFORM expire_old_requests();
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_expire_on_write
  AFTER INSERT OR UPDATE ON partner_requests
  FOR EACH STATEMENT
  EXECUTE FUNCTION expire_requests_on_write();
