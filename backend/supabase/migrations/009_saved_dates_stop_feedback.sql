-- Add stop feedback for completed dates (smile ratings per location)
ALTER TABLE saved_dates ADD COLUMN IF NOT EXISTS stop_feedback JSONB DEFAULT NULL;
