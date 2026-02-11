-- ClimbMatch Database Schema

-- Enums
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE location_type AS ENUM ('gym', 'crag');
CREATE TYPE climbing_type AS ENUM ('indoor', 'sport', 'boulder', 'trad', 'multi_pitch');
CREATE TYPE goal_type AS ENUM ('project', 'mileage', 'easy_day', 'training', 'any');
CREATE TYPE request_status AS ENUM ('active', 'matched', 'cancelled', 'expired');
CREATE TYPE interest_status AS ENUM ('pending', 'accepted', 'declined');

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  home_area TEXT,
  climbing_types climbing_type[] DEFAULT '{}',
  experience_level experience_level,
  sport_grade_range TEXT,
  boulder_grade_range TEXT,
  weight_kg NUMERIC,
  share_weight BOOLEAN DEFAULT false,
  gear JSONB DEFAULT '{"rope":false,"quickdraws":false,"belayDevice":false,"crashPad":false,"helmet":false}',
  has_car BOOLEAN DEFAULT false,
  bio TEXT,
  languages TEXT[] DEFAULT '{}',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Requests table
CREATE TABLE partner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  flexible BOOLEAN DEFAULT false,
  location_type location_type NOT NULL,
  location_name TEXT NOT NULL,
  climbing_type climbing_type NOT NULL,
  goal_type goal_type DEFAULT 'any',
  desired_grade_range TEXT,
  notes TEXT,
  needs_gear JSONB DEFAULT '{"rope":false,"quickdraws":false,"belayDevice":false,"crashPad":false,"helmet":false}',
  carpool_needed BOOLEAN DEFAULT false,
  weight_relevant BOOLEAN DEFAULT false,
  max_weight_difference_kg NUMERIC,
  status request_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Interests (connection requests)
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES partner_requests(id) ON DELETE CASCADE,
  status interest_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user_id, request_id)
);

-- Blocks
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_partner_requests_user_id ON partner_requests(user_id);
CREATE INDEX idx_partner_requests_status_date ON partner_requests(status, date);
CREATE INDEX idx_partner_requests_location ON partner_requests(location_name);
CREATE INDEX idx_interests_from_user ON interests(from_user_id);
CREATE INDEX idx_interests_to_user ON interests(to_user_id);
CREATE INDEX idx_interests_request ON interests(request_id);
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER partner_requests_updated_at BEFORE UPDATE ON partner_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER interests_updated_at BEFORE UPDATE ON interests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: anyone authed can read, users edit own
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Partner Requests: public read active, CRUD own
CREATE POLICY "Active requests are viewable by authenticated users"
  ON partner_requests FOR SELECT TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create their own requests"
  ON partner_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own requests"
  ON partner_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own requests"
  ON partner_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Interests
CREATE POLICY "Users can see interests they sent or received"
  ON interests FOR SELECT TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create interests"
  ON interests FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Request owners can update interest status"
  ON interests FOR UPDATE TO authenticated
  USING (to_user_id = auth.uid()) WITH CHECK (to_user_id = auth.uid());

-- Blocks
CREATE POLICY "Users can see their own blocks"
  ON blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());

CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete their own blocks"
  ON blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- Reports: create-only
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Function to auto-expire old requests
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE partner_requests
  SET status = 'expired'
  WHERE status = 'active'
    AND (
      (date < CURRENT_DATE)
      OR (date = CURRENT_DATE AND end_time IS NOT NULL AND end_time + INTERVAL '6 hours' < CURRENT_TIME)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
