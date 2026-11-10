CREATE OR REPLACE FUNCTION public.grant_correction_rewards(_user_id uuid, _xp integer, _points integer, _score integer, _official boolean)
RETURNS public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.user_stats;
  today date := CURRENT_DATE;
  new_streak int;
BEGIN
  IF _xp < 0 OR _xp > 500 OR _points < 0 OR _points > 500 OR _score < 0 OR _score > 1000 THEN
    RAISE EXCEPTION 'invalid reward';
  END IF;
  INSERT INTO public.user_stats(user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO s FROM public.user_stats WHERE user_id = _user_id FOR UPDATE;
  IF s.last_activity_date IS NULL THEN new_streak := 1;
  ELSIF s.last_activity_date = today THEN new_streak := s.current_streak;
  ELSIF s.last_activity_date = today - 1 THEN new_streak := s.current_streak + 1;
  ELSE new_streak := 1;
  END IF;
  UPDATE public.user_stats SET
    xp = xp + _xp,
    points = points + _points,
    current_streak = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak),
    last_activity_date = today,
    essays_completed = essays_completed + 1,
    level = GREATEST(1, FLOOR(SQRT((xp + _xp)::numeric / 100))::int + 1),
    max_score = CASE WHEN _official THEN GREATEST(COALESCE(max_score,0), _score) ELSE max_score END,
    updated_at = now()
  WHERE user_id = _user_id
  RETURNING * INTO s;
  RETURN s;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_correction_rewards(uuid, integer, integer, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_correction_rewards(uuid, integer, integer, integer, boolean) TO service_role;

REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_max_score(integer) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Users can insert own history" ON public.correction_history;
REVOKE INSERT, UPDATE ON public.correction_history FROM anon, authenticated;
GRANT ALL ON public.correction_history TO service_role;