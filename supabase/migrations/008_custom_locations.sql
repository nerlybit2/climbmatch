-- User-submitted locations shared across all users
CREATE TABLE IF NOT EXISTS custom_locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('gym', 'crag')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Prevent duplicates (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS custom_locations_name_type_idx
  ON custom_locations (lower(name), type);

-- Any authenticated user can read
ALTER TABLE custom_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custom locations"
  ON custom_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add locations"
  ON custom_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
