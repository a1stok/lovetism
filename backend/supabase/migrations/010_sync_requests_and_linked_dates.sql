-- Sync requests: user 1 invites user 2 to add a past date to their past dates (shared date)
CREATE TABLE IF NOT EXISTS sync_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_date_id UUID NOT NULL REFERENCES saved_dates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS sync_requests_to_user_idx ON sync_requests(to_user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS sync_requests_unique ON sync_requests(from_user_id, to_user_id, saved_date_id);

ALTER TABLE sync_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync requests they sent or received"
  ON sync_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create sync requests as sender"
  ON sync_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipient can update to accept/reject"
  ON sync_requests FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Link two saved_dates when synced (both users have the date in past dates)
ALTER TABLE saved_dates
ADD COLUMN IF NOT EXISTS linked_saved_date_id UUID REFERENCES saved_dates(id) ON DELETE SET NULL;
