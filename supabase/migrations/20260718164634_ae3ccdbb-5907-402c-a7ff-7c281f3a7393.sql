
-- 1) Purchase RPC: validates points server-side and grants item atomically
CREATE OR REPLACE FUNCTION public.purchase_mascot_item(_item_id uuid)
RETURNS public.user_inventory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_price int;
  v_points int;
  v_row public.user_inventory;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT price INTO v_price FROM public.mascot_items WHERE id = _item_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'item not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_inventory WHERE user_id = v_user AND item_id = _item_id) THEN
    RAISE EXCEPTION 'item already owned';
  END IF;

  SELECT points INTO v_points FROM public.user_stats WHERE user_id = v_user FOR UPDATE;
  IF v_points IS NULL THEN
    INSERT INTO public.user_stats(user_id) VALUES (v_user);
    v_points := 0;
  END IF;

  IF v_points < v_price THEN
    RAISE EXCEPTION 'insufficient points';
  END IF;

  UPDATE public.user_stats
    SET points = points - v_price, updated_at = now()
    WHERE user_id = v_user;

  INSERT INTO public.user_inventory(user_id, item_id)
    VALUES (v_user, _item_id)
    RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_mascot_item(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_mascot_item(uuid) TO authenticated;

-- 2) Record max score RPC: only bumps up, and only if a matching correction_history row exists
CREATE OR REPLACE FUNCTION public.record_max_score(_score int)
RETURNS public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.user_stats;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF _score IS NULL OR _score < 0 OR _score > 1000 THEN
    RAISE EXCEPTION 'invalid score';
  END IF;

  -- Must correspond to a real correction owned by the user, recorded recently
  IF NOT EXISTS (
    SELECT 1 FROM public.correction_history
    WHERE user_id = v_user
      AND created_at > now() - interval '10 minutes'
      AND COALESCE((result_json->>'total_score')::int, -1) = _score
  ) THEN
    RAISE EXCEPTION 'no matching correction for this score';
  END IF;

  UPDATE public.user_stats
    SET max_score = GREATEST(COALESCE(max_score, 0), _score),
        updated_at = now()
    WHERE user_id = v_user
    RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_max_score(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_max_score(int) TO authenticated;

-- 3) award_xp / check_and_unlock_achievements must run as owner so we can revoke direct table writes
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _xp integer, _points integer)
RETURNS public.user_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.user_stats;
  today DATE := CURRENT_DATE;
  new_streak INT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _xp IS NULL OR _xp < 0 OR _xp > 500 OR _points IS NULL OR _points < 0 OR _points > 500 THEN
    RAISE EXCEPTION 'invalid xp/points amount';
  END IF;

  INSERT INTO public.user_stats(user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO s FROM public.user_stats WHERE user_id = _user_id;

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
    updated_at = now()
  WHERE user_id = _user_id
  RETURNING * INTO s;
  RETURN s;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, int, int) TO authenticated;

-- 4) Lock down direct writes to user_stats and user_inventory inserts
-- Drop existing update policies on user_stats
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_stats' AND cmd IN ('UPDATE','INSERT')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_stats', p.policyname);
  END LOOP;
END $$;

-- Revoke direct write privileges from authenticated (SECURITY DEFINER functions bypass this)
REVOKE INSERT, UPDATE, DELETE ON public.user_stats FROM authenticated;

-- user_inventory: forbid direct INSERT so purchases must go through purchase_mascot_item
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_inventory' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_inventory', p.policyname);
  END LOOP;
END $$;

REVOKE INSERT ON public.user_inventory FROM authenticated;
