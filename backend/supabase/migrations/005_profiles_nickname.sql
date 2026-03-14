-- Add nickname to profiles for partner lookup (unique, case-insensitive)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_lower_unique ON profiles (LOWER(nickname)) WHERE nickname IS NOT NULL AND nickname != '';
