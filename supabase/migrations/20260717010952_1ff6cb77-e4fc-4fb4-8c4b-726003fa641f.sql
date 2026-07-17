
-- Restrict user_stats SELECT to owner only
DROP POLICY IF EXISTS "Authenticated users can read leaderboard stats" ON public.user_stats;
DROP POLICY IF EXISTS "leaderboard public read" ON public.user_stats;

CREATE POLICY "Users can read own stats"
ON public.user_stats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Public leaderboard view exposing only non-sensitive aggregate fields joined with public display name
CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true)
AS
SELECT
  s.user_id,
  p.display_name,
  p.avatar_url,
  s.xp,
  s.level,
  s.current_streak,
  s.essays_completed
FROM public.user_stats s
LEFT JOIN public.profiles p ON p.user_id = s.user_id
ORDER BY s.xp DESC
LIMIT 100;

-- Views inherit privileges; but we need explicit grants for the Data API.
-- Since security_invoker respects underlying RLS, we need a SECURITY DEFINER function instead
-- so authenticated users can see the leaderboard without seeing raw user_stats rows.
DROP VIEW IF EXISTS public.leaderboard;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  xp int,
  level int,
  current_streak int,
  essays_completed int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id, p.display_name, p.avatar_url,
         s.xp, s.level, s.current_streak, s.essays_completed
  FROM public.user_stats s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  ORDER BY s.xp DESC
  LIMIT COALESCE(_limit, 50);
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;
