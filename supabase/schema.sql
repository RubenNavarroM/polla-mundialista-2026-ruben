-- ============================================================
-- Polla Mundialista 2026 — Supabase Schema
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Predictions
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL CHECK (home_score >= 0),
  away_score INTEGER NOT NULL CHECK (away_score >= 0),
  locked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, match_id)
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Predictions are viewable by everyone" ON public.predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users can update their own unlocked predictions" ON public.predictions;

CREATE POLICY "Predictions are viewable by everyone" ON public.predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id AND locked = FALSE);

-- Bracket Predictions
CREATE TABLE IF NOT EXISTS public.bracket_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  champion_team TEXT,
  runner_up TEXT,
  third_place TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.bracket_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bracket predictions are viewable by everyone" ON public.bracket_predictions;
DROP POLICY IF EXISTS "Users can insert their own bracket" ON public.bracket_predictions;
DROP POLICY IF EXISTS "Users can update their own bracket" ON public.bracket_predictions;

CREATE POLICY "Bracket predictions are viewable by everyone" ON public.bracket_predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own bracket" ON public.bracket_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bracket" ON public.bracket_predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS predictions_updated_at ON public.predictions;
CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS bracket_predictions_updated_at ON public.bracket_predictions;
CREATE TRIGGER bracket_predictions_updated_at
  BEFORE UPDATE ON public.bracket_predictions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile is created manually after username selection
  -- This trigger is a placeholder for future use
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Leaderboard View
-- Puntos: Exacto=5, Resultado=2, Campeón=10, Subcampeón=5
-- Nota: home_score/away_score en predictions son los resultados
--       reales. Necesitás una tabla de resultados reales o
--       usar la API externa para calcular puntos.
--       Esta es una vista de ejemplo con estructura base.
-- ============================================================
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  COALESCE(SUM(
    CASE
      -- Marcador exacto: 5 puntos (requiere tabla de resultados reales)
      WHEN 0 = 1 THEN 5
      ELSE 0
    END
  ), 0) AS total_points,
  0 AS exact_scores,
  0 AS correct_results,
  RANK() OVER (ORDER BY COALESCE(SUM(0), 0) DESC) AS rank
FROM public.profiles p
LEFT JOIN public.predictions pred ON pred.user_id = p.id
GROUP BY p.id, p.username, p.avatar_url;
