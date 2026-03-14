-- Journal visibility: private (owner only) or partner (owner + partner when generating together)
ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'partner'));

-- Replace journals SELECT policy to include partner-visible journals
DROP POLICY IF EXISTS "Users can view their own journals" ON journals;

-- Partnerships: user connections for date planning
CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  user_id_2 UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS partnerships_user_1_idx ON partnerships(user_id_1);
CREATE INDEX IF NOT EXISTS partnerships_user_2_idx ON partnerships(user_id_2);

ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

-- Users can see partnerships they're part of
CREATE POLICY "Users can view own partnerships"
  ON partnerships FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can create partnership (invite) as user_id_1
CREATE POLICY "Users can create partnership as inviter"
  ON partnerships FOR INSERT
  WITH CHECK (auth.uid() = user_id_1);

-- User_id_2 can update to accept (status -> active)
CREATE POLICY "Users can update partnership they received"
  ON partnerships FOR UPDATE
  USING (auth.uid() = user_id_2)
  WITH CHECK (auth.uid() = user_id_2);

-- Either user can delete (remove connection)
CREATE POLICY "Users can delete own partnership"
  ON partnerships FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can view own journals + partner's partner-visible journals
CREATE POLICY "Users can view own and partner journals"
  ON journals FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      visibility = 'partner'
      AND EXISTS (
        SELECT 1 FROM partnerships p
        WHERE p.status = 'active'
        AND ((p.user_id_1 = auth.uid() AND p.user_id_2 = journals.user_id)
             OR (p.user_id_2 = auth.uid() AND p.user_id_1 = journals.user_id))
      )
    )
  );
