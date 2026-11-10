DROP POLICY IF EXISTS "users insert own ua" ON public.user_achievements;
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM anon, authenticated;
ALTER FUNCTION public.check_and_unlock_achievements(uuid) SECURITY DEFINER;
ALTER FUNCTION public.check_and_unlock_achievements(uuid) SET search_path = public;
REVOKE ALL ON FUNCTION public.check_and_unlock_achievements(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_unlock_achievements(uuid) TO authenticated;