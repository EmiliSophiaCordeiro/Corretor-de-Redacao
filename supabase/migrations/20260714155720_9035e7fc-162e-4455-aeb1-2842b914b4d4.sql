DROP POLICY IF EXISTS "leaderboard public read" ON public.user_stats;
REVOKE SELECT ON public.user_stats FROM anon;
CREATE POLICY "Authenticated users can read leaderboard stats"
ON public.user_stats
FOR SELECT
TO authenticated
USING (true);