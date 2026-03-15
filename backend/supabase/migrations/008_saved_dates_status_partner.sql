-- Add status and partner tracker to saved_dates
ALTER TABLE saved_dates
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'saved',
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partnerships(id) ON DELETE SET NULL;


-- Create an index for easier querying by status
CREATE INDEX IF NOT EXISTS saved_dates_status_idx ON saved_dates(user_id, status, created_at DESC);
