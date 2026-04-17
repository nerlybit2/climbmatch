-- Add GPS coordinates to user profiles for proximity-based discover sorting
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
