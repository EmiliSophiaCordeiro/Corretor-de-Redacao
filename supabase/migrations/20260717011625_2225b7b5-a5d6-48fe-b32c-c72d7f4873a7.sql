
-- Revoke execute from anon/public for all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_and_unlock_achievements(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bump_post_comments() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_post_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Ensure signed-in users can still call the RPCs the app depends on
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_unlock_achievements(uuid) TO authenticated;
