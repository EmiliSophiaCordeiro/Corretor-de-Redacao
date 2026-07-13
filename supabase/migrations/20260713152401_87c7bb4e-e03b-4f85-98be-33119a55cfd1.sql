DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "View profiles respecting privacy" ON public.profiles
FOR SELECT TO authenticated
USING (is_public = true OR auth.uid() = user_id);