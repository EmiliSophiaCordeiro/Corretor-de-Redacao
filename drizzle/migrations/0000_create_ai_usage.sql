CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('correction','ocr')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_kind_created_idx ON public.ai_usage (user_id, kind, created_at DESC);
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;