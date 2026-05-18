
-- ============ USER STATS ============
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  essays_completed INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own stats" ON public.user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own stats" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own stats" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- Leaderboard precisa de leitura pública limitada
CREATE POLICY "leaderboard public read" ON public.user_stats FOR SELECT TO anon, authenticated USING (true);

-- ============ ACHIEVEMENTS ============
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  points_reward INTEGER NOT NULL DEFAULT 25,
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone view achievements" ON public.achievements FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own ua" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own ua" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ DAILY CHALLENGES ============
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  goal_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 30,
  points_reward INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone view challenges" ON public.daily_challenges FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.user_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id, day)
);
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own udc" ON public.user_daily_challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own udc" ON public.user_daily_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own udc" ON public.user_daily_challenges FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ MASCOT SHOP ============
CREATE TABLE public.mascot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  price INTEGER NOT NULL DEFAULT 100,
  preview_emoji TEXT,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mascot_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "everyone view items" ON public.mascot_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.mascot_items(id) ON DELETE CASCADE,
  equipped BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own inv" ON public.user_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own inv" ON public.user_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own inv" ON public.user_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.xp_for_level(_level INT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT (_level * _level * 100);
$$;

CREATE OR REPLACE FUNCTION public.award_xp(_user_id UUID, _xp INT, _points INT)
RETURNS public.user_stats
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.user_stats;
  today DATE := CURRENT_DATE;
  new_streak INT;
BEGIN
  INSERT INTO public.user_stats(user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO s FROM public.user_stats WHERE user_id = _user_id;

  IF s.last_activity_date IS NULL THEN
    new_streak := 1;
  ELSIF s.last_activity_date = today THEN
    new_streak := s.current_streak;
  ELSIF s.last_activity_date = today - 1 THEN
    new_streak := s.current_streak + 1;
  ELSE
    new_streak := 1;
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
END; $$;

-- Seed achievements
INSERT INTO public.achievements (code, name, description, icon, xp_reward, points_reward, rarity) VALUES
('first_essay', 'Primeira Redação', 'Você enviou sua primeira redação!', '✍️', 50, 50, 'common'),
('streak_3', 'Aquecendo', 'Mantenha uma sequência de 3 dias', '🔥', 75, 50, 'common'),
('streak_7', 'Semana Perfeita', '7 dias seguidos escrevendo', '⚡', 150, 100, 'rare'),
('streak_30', 'Mestre da Disciplina', '30 dias consecutivos', '👑', 500, 500, 'legendary'),
('essays_10', 'Dedicado', '10 redações concluídas', '📚', 200, 150, 'rare'),
('essays_50', 'Veterano', '50 redações concluídas', '🏆', 600, 500, 'epic'),
('score_900', 'Nota Ouro', 'Conseguiu nota acima de 900', '🥇', 300, 250, 'epic'),
('score_1000', 'Redação Nota 1000', 'Conseguiu a nota máxima!', '💎', 1000, 1000, 'legendary');

INSERT INTO public.daily_challenges (code, title, description, goal_type, goal_value, xp_reward, points_reward) VALUES
('daily_essay', 'Escreva uma redação', 'Complete uma correção hoje', 'essays', 1, 50, 30),
('daily_words', 'Escreva 1000 palavras', 'Some 1000 palavras escritas hoje', 'words', 1000, 75, 50),
('daily_streak', 'Mantenha sua sequência', 'Volte amanhã para manter o streak', 'login', 1, 25, 15);

INSERT INTO public.mascot_items (code, name, category, rarity, price, preview_emoji, description, is_default) VALUES
('base_owl', 'Coruja Carraco', 'base', 'common', 0, '🦉', 'O mascote padrão', true),
('hat_cap', 'Boné Estudantil', 'hat', 'common', 100, '🧢', 'Para os estudiosos', false),
('hat_crown', 'Coroa Real', 'hat', 'legendary', 2000, '👑', 'Apenas os mestres usam', false),
('hat_graduation', 'Capelo', 'hat', 'rare', 500, '🎓', 'Formatura está chegando', false),
('glasses_round', 'Óculos Redondos', 'glasses', 'common', 150, '👓', 'Estilo intelectual', false),
('glasses_sun', 'Óculos Escuros', 'glasses', 'rare', 400, '🕶️', 'Demais para esse sol', false),
('access_book', 'Livro Mágico', 'accessory', 'rare', 600, '📖', 'Companheiro de estudos', false),
('access_pen', 'Caneta Dourada', 'accessory', 'epic', 1200, '🖊️', 'Para escritores natos', false),
('theme_neon', 'Tema Neon', 'theme', 'epic', 1500, '✨', 'Brilho futurista', false);
