DROP POLICY IF EXISTS "everyone view achievements" ON public.achievements;
CREATE POLICY "Signed-in users view achievements" ON public.achievements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.achievements FROM anon;

DROP POLICY IF EXISTS "everyone view items" ON public.mascot_items;
CREATE POLICY "Signed-in users view items" ON public.mascot_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.mascot_items FROM anon;

DROP POLICY IF EXISTS "everyone view challenges" ON public.daily_challenges;
CREATE POLICY "Signed-in users view active challenges" ON public.daily_challenges FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND is_active = true);
REVOKE SELECT ON public.daily_challenges FROM anon;

DROP POLICY IF EXISTS "Posts readable" ON public.community_posts;
CREATE POLICY "Posts readable by signed-in users" ON public.community_posts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Avatars readable for self and public profiles" ON storage.objects;
CREATE POLICY "Users read own avatar" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY "Signed-in users read public profile avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (select auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id::text = (storage.foldername(objects.name))[1] AND p.is_public = true));