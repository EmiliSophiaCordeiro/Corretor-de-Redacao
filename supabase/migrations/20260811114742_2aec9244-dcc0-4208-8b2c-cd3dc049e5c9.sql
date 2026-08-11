DROP POLICY IF EXISTS "Users read own avatar" ON storage.objects;
CREATE POLICY "Avatars readable for self and public profiles"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id::text = (storage.foldername(name))[1]
        AND p.is_public = true
    )
  )
);