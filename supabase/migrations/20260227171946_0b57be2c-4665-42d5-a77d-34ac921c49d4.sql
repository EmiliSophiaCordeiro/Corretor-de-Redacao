
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Correction modes (user-created custom modes + defaults)
CREATE TABLE public.correction_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tone TEXT DEFAULT 'strict',
  is_builtin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.correction_modes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own modes and builtins" ON public.correction_modes FOR SELECT TO authenticated USING (is_builtin = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own modes" ON public.correction_modes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_builtin = false);
CREATE POLICY "Users can update own modes" ON public.correction_modes FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_builtin = false);
CREATE POLICY "Users can delete own modes" ON public.correction_modes FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_builtin = false);
-- Allow anon to see builtins too
CREATE POLICY "Anon can view builtins" ON public.correction_modes FOR SELECT TO anon USING (is_builtin = true);

-- Insert built-in modes
INSERT INTO public.correction_modes (name, description, system_prompt, tone, is_builtin) VALUES
('ENEM Padrão', 'Correção rigorosa seguindo critérios oficiais do INEP', 'Você é um corretor extremamente rigoroso do ENEM. Siga o manual oficial do INEP ao pé da letra. Seja preciso, frio e estritamente analítico.', 'strict', true),
('Acadêmico/Formal', 'Correção focada em escrita acadêmica e formal', 'Você é um professor universitário avaliando um texto acadêmico. Foque na clareza argumentativa, rigor metodológico, uso correto de citações e normas ABNT. Seja exigente mas construtivo.', 'formal', true),
('Escrita Criativa', 'Avaliação de textos criativos e literários', 'Você é um editor literário experiente. Avalie criatividade, originalidade, uso de figuras de linguagem, construção de narrativa e estilo. Seja encorajador mas honesto sobre pontos fracos.', 'creative', true);

-- Correction history
CREATE TABLE public.correction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme TEXT NOT NULL,
  essay_text TEXT NOT NULL,
  mode_name TEXT NOT NULL DEFAULT 'ENEM Padrão',
  result_json JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.correction_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own history" ON public.correction_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.correction_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.correction_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- User calibration preferences
CREATE TABLE public.user_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  custom_criteria TEXT,
  preferred_tone TEXT DEFAULT 'strict',
  common_feedback_patterns TEXT,
  additional_instructions TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_calibration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own calibration" ON public.user_calibration FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own calibration" ON public.user_calibration FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calibration" ON public.user_calibration FOR UPDATE TO authenticated USING (auth.uid() = user_id);
