
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS target_value integer,
  ADD COLUMN IF NOT EXISTS metric_key text;

INSERT INTO public.achievements (code, name, description, icon, xp_reward, points_reward, rarity, category, target_value, metric_key) VALUES
  ('first_login',       'Bem-vindo',              'Fez seu primeiro login no Carraco',           '👋', 50,  20,  'common',    'iniciante',    1,   'logins'),
  ('profile_complete',  'Identidade',             'Completou as informações do perfil',          '🪪', 75,  30,  'common',    'iniciante',    1,   'profile_complete'),
  ('first_correction',  'Primeira Correção',      'Recebeu sua primeira correção do Carraco',    '✍️', 100, 50,  'common',    'iniciante',    1,   'essays_completed'),
  ('streak_15',         'Quinzena de Aço',        '15 dias seguidos estudando',                  '🔥', 300, 150, 'epic',      'consistencia', 15,  'longest_streak'),
  ('streak_100',        'Centenário',             '100 dias seguidos estudando',                 '💎', 1500,800, 'legendary', 'consistencia', 100, 'longest_streak'),
  ('essays_5',          'Começando a Pegar',      'Enviou 5 redações',                           '📝', 150, 75,  'common',    'redacao',      5,   'essays_completed'),
  ('essays_25',         'Maratonista',            'Enviou 25 redações',                          '🏃', 500, 250, 'epic',      'redacao',      25,  'essays_completed'),
  ('essays_100',        'Centena de Tinta',       'Enviou 100 redações',                         '💯', 2000,1000,'legendary', 'redacao',      100, 'essays_completed'),
  ('score_800',         'Nota de Prata',          'Tirou nota acima de 800',                     '🥈', 400, 200, 'rare',      'redacao',      800, 'max_score'),
  ('xp_1000',           'Mil de XP',              'Acumulou 1.000 XP',                           '⚡', 200, 100, 'rare',      'estudos',      1000,'xp'),
  ('xp_5000',           'Cinco Mil de XP',        'Acumulou 5.000 XP',                           '🌟', 600, 300, 'epic',      'estudos',      5000,'xp'),
  ('xp_10000',          'Dez Mil de XP',          'Acumulou 10.000 XP',                          '✨', 1200,600, 'legendary', 'estudos',      10000,'xp'),
  ('level_10',          'Nível 10',               'Alcançou o nível 10',                         '🎖️', 300, 150, 'rare',      'estudos',      10,  'level'),
  ('level_25',          'Nível 25',               'Alcançou o nível 25',                         '🏅', 800, 400, 'epic',      'estudos',      25,  'level'),
  ('level_50',          'Nível 50',               'Alcançou o nível 50',                         '👑', 2000,1000,'legendary', 'estudos',      50,  'level'),
  ('community_first_post',     'Primeira Voz',          'Fez sua primeira publicação',          '💬', 100, 50,  'common', 'comunidade', 1,  'posts_count'),
  ('community_first_comment',  'Conversador',           'Deixou seu primeiro comentário',       '🗨️', 75,  30,  'common', 'comunidade', 1,  'comments_count'),
  ('community_first_like',     'Querido',               'Recebeu sua primeira curtida',         '❤️', 100, 50,  'common', 'comunidade', 1,  'likes_received'),
  ('community_likes_10',       'Influente',             'Recebeu 10 curtidas',                  '💖', 250, 125, 'rare',   'comunidade', 10, 'likes_received'),
  ('community_likes_50',       'Estrela da Comunidade', 'Recebeu 50 curtidas',                  '🌠', 700, 350, 'epic',   'comunidade', 50, 'likes_received'),
  ('community_posts_10',       'Voz Constante',         'Fez 10 publicações',                   '📣', 300, 150, 'rare',   'comunidade', 10, 'posts_count')
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  target_value = EXCLUDED.target_value,
  metric_key = EXCLUDED.metric_key;

UPDATE public.achievements SET category='consistencia', target_value=3,   metric_key='longest_streak'   WHERE code='streak_3';
UPDATE public.achievements SET category='consistencia', target_value=7,   metric_key='longest_streak'   WHERE code='streak_7';
UPDATE public.achievements SET category='consistencia', target_value=30,  metric_key='longest_streak'   WHERE code='streak_30';
UPDATE public.achievements SET category='redacao',      target_value=1,   metric_key='essays_completed' WHERE code='first_essay';
UPDATE public.achievements SET category='redacao',      target_value=10,  metric_key='essays_completed' WHERE code='essays_10';
UPDATE public.achievements SET category='redacao',      target_value=50,  metric_key='essays_completed' WHERE code='essays_50';
UPDATE public.achievements SET category='redacao',      target_value=900, metric_key='max_score'        WHERE code='score_900';
UPDATE public.achievements SET category='redacao',      target_value=1000,metric_key='max_score'        WHERE code='score_1000';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{
    "notifications": {"achievements": true, "community": true, "corrections": true, "email": false},
    "privacy": {"show_stats": true, "show_achievements": true},
    "accessibility": {"font_scale": 1, "high_contrast": false, "reduce_motion": false}
  }'::jsonb;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT TO authenticated USING (true);

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS max_score integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'geral',
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts readable" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Posts insert own" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Posts update own" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Posts delete own" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_comments TO authenticated;
GRANT ALL ON public.community_comments TO service_role;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments readable" ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Comments insert own" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments update own" ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Comments delete own" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_likes TO authenticated;
GRANT ALL ON public.community_likes TO service_role;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes readable" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Likes insert own" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Likes delete own" ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','comment')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.community_reports TO authenticated;
GRANT ALL ON public.community_reports TO service_role;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reports insert own" ON public.community_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reports read own" ON public.community_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

CREATE OR REPLACE FUNCTION public.bump_post_likes() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE public.community_posts SET likes_count=likes_count+1 WHERE id=NEW.post_id;
  ELSIF TG_OP='DELETE' THEN UPDATE public.community_posts SET likes_count=GREATEST(likes_count-1,0) WHERE id=OLD.post_id;
  END IF;
  RETURN NULL;
END;$$;
DROP TRIGGER IF EXISTS trg_post_likes ON public.community_likes;
CREATE TRIGGER trg_post_likes AFTER INSERT OR DELETE ON public.community_likes FOR EACH ROW EXECUTE FUNCTION public.bump_post_likes();

CREATE OR REPLACE FUNCTION public.bump_post_comments() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE public.community_posts SET comments_count=comments_count+1 WHERE id=NEW.post_id;
  ELSIF TG_OP='DELETE' THEN UPDATE public.community_posts SET comments_count=GREATEST(comments_count-1,0) WHERE id=OLD.post_id;
  END IF;
  RETURN NULL;
END;$$;
DROP TRIGGER IF EXISTS trg_post_comments ON public.community_comments;
CREATE TRIGGER trg_post_comments AFTER INSERT OR DELETE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.bump_post_comments();

CREATE OR REPLACE FUNCTION public.update_touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;
DROP TRIGGER IF EXISTS trg_post_updated ON public.community_posts;
CREATE TRIGGER trg_post_updated BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_touch_updated_at();
DROP TRIGGER IF EXISTS trg_comment_updated ON public.community_comments;
CREATE TRIGGER trg_comment_updated BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.update_touch_updated_at();

DO $$ BEGIN
  ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_ach_unique UNIQUE(user_id, achievement_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  s public.user_stats;
  p public.profiles;
  v_posts int;
  v_comments int;
  v_likes int;
  a record;
  metric_val int;
  unlocked_id uuid;
BEGIN
  SELECT * INTO s FROM public.user_stats WHERE user_id=_user_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id=_user_id;
  SELECT COUNT(*) INTO v_posts FROM public.community_posts WHERE user_id=_user_id;
  SELECT COUNT(*) INTO v_comments FROM public.community_comments WHERE user_id=_user_id;
  SELECT COALESCE(SUM(likes_count),0) INTO v_likes FROM public.community_posts WHERE user_id=_user_id;

  FOR a IN SELECT * FROM public.achievements WHERE metric_key IS NOT NULL AND target_value IS NOT NULL LOOP
    metric_val := CASE a.metric_key
      WHEN 'xp' THEN s.xp
      WHEN 'level' THEN s.level
      WHEN 'essays_completed' THEN s.essays_completed
      WHEN 'longest_streak' THEN s.longest_streak
      WHEN 'max_score' THEN s.max_score
      WHEN 'logins' THEN 1
      WHEN 'profile_complete' THEN CASE WHEN p.display_name IS NOT NULL AND length(coalesce(p.bio,''))>0 THEN 1 ELSE 0 END
      WHEN 'posts_count' THEN v_posts
      WHEN 'comments_count' THEN v_comments
      WHEN 'likes_received' THEN v_likes
      ELSE 0
    END;
    IF metric_val >= a.target_value THEN
      INSERT INTO public.user_achievements(user_id, achievement_id)
      VALUES (_user_id, a.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING achievement_id INTO unlocked_id;
      IF unlocked_id IS NOT NULL THEN
        RETURN NEXT unlocked_id;
      END IF;
    END IF;
  END LOOP;
END;$$;

GRANT EXECUTE ON FUNCTION public.check_and_unlock_achievements(uuid) TO authenticated, service_role;
