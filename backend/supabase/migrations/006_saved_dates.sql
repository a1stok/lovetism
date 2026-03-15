-- Saved date itineraries for users
CREATE TABLE IF NOT EXISTS saved_dates (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  personal_touch      TEXT,
  total_estimated_spend INT,
  location_name       TEXT,
  weather_summary     TEXT,
  weather_advice      TEXT[],
  stops               JSONB NOT NULL DEFAULT '[]',
  google_maps_url     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_dates_user_idx ON saved_dates(user_id, created_at DESC);

ALTER TABLE saved_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved dates"
  ON saved_dates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved dates"
  ON saved_dates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved dates"
  ON saved_dates FOR DELETE
  USING (auth.uid() = user_id);
