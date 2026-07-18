
-- Drop the overly-permissive leaderboard read policy on user_stats
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='user_stats' AND cmd='SELECT'
      AND policyname <> 'Users can view own stats'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_stats', p.policyname);
  END LOOP;
END $$;

-- Ensure owner-only SELECT policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_stats'
      AND policyname='Users can view own stats'
  ) THEN
    CREATE POLICY "Users can view own stats" ON public.user_stats
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- get_leaderboard must be SECURITY DEFINER to read across users under owner-only RLS
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text,
              xp integer, level integer, current_streak integer, essays_completed integer)
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

REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
