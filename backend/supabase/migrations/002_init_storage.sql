-- ============================================================
-- Storage buckets for file uploads (avatars + journal covers)
-- ============================================================

-- 1. Avatars bucket (profile photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Journal assets bucket (journal cover images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-assets', 'journal-assets', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Avatars storage policies
-- ============================================================

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
CREATE POLICY "Users can upload their own avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( 
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;
CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- Journal assets storage policies
-- ============================================================

DROP POLICY IF EXISTS "Journal assets are publicly accessible." ON storage.objects;
CREATE POLICY "Journal assets are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'journal-assets' );

DROP POLICY IF EXISTS "Authenticated users can upload journal assets." ON storage.objects;
CREATE POLICY "Authenticated users can upload journal assets."
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-assets'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated users can update journal assets." ON storage.objects;
CREATE POLICY "Authenticated users can update journal assets."
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'journal-assets'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated users can delete journal assets." ON storage.objects;
CREATE POLICY "Authenticated users can delete journal assets."
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-assets'
    AND auth.role() = 'authenticated'
  );
