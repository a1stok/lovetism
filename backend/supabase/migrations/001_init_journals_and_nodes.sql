-- Create a public profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Create a Trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Attach the trigger to Supabase's auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Create journals table
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  background_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for journals
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Journals Policies
CREATE POLICY "Users can create their own journals"
  ON journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own journals"
  ON journals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own journals"
  ON journals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journals"
  ON journals FOR DELETE
  USING (auth.uid() = user_id);


-- Create nodes table (folders and files)
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES nodes ON DELETE CASCADE, -- NULL if top-level
  type TEXT CHECK (type IN ('folder', 'file')) NOT NULL,
  name TEXT NOT NULL,
  content JSONB, -- For files: Tiptap JSON, For folders: NULL
  position INTEGER DEFAULT 0, -- Order in the list
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for nodes
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

-- Nodes Policies
-- Note: We check if the user owns the parent journal to allow access to the nodes
CREATE POLICY "Users can create nodes in their journals"
  ON nodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journals
      WHERE id = nodes.journal_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view nodes in their journals"
  ON nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journals
      WHERE id = nodes.journal_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nodes in their journals"
  ON nodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM journals
      WHERE id = nodes.journal_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete nodes in their journals"
  ON nodes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM journals
      WHERE id = nodes.journal_id
      AND user_id = auth.uid()
    )
  );
