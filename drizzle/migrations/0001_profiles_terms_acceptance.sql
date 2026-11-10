ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz, ADD COLUMN IF NOT EXISTS terms_version text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tv text := NULLIF(NEW.raw_user_meta_data->>'terms_version', '');
BEGIN
  INSERT INTO public.profiles (user_id, display_name, terms_accepted_at, terms_version)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE WHEN _tv IS NOT NULL THEN now() END,
    _tv
  );
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);