
DROP POLICY IF EXISTS "Likes readable" ON public.community_likes;

CREATE POLICY "Users can read their own likes"
ON public.community_likes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
