
-- Revoke EXECUTE on SECURITY DEFINER trigger functions from PUBLIC/anon/authenticated.
-- Triggers execute as the table owner regardless of grant, so no callers need EXECUTE.
REVOKE EXECUTE ON FUNCTION public.bump_post_comments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_post_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read leaderboard-safe columns from user_stats so
-- get_leaderboard can run as SECURITY INVOKER (removes the definer-executable finding).
CREATE POLICY "Leaderboard readable stats"
ON public.user_stats
FOR SELECT
TO authenticated
USING (true);

-- Switch get_leaderboard to SECURITY INVOKER — it now relies on RLS above.
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, xp integer, level integer, current_streak integer, essays_completed integer)
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT s.user_id, p.display_name, p.avatar_url,
         s.xp, s.level, s.current_streak, s.essays_completed
  FROM public.user_stats s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  ORDER BY s.xp DESC
  LIMIT COALESCE(_limit, 50);
$function$;
