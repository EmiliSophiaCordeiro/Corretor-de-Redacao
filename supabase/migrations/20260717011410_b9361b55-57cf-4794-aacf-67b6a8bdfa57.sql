
DROP POLICY IF EXISTS "Comments readable" ON public.community_comments;

CREATE POLICY "Comments readable when parent post is visible"
ON public.community_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = community_comments.post_id
  )
);
