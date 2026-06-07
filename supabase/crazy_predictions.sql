-- ============================================================
-- Predicciones Locas — Schema
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Banco de preguntas (13 estadísticas)
CREATE TABLE IF NOT EXISTS public.crazy_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  stat_key TEXT NOT NULL UNIQUE,
  emoji TEXT DEFAULT '🎲' NOT NULL,
  auto_calculable BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.crazy_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.crazy_questions;
CREATE POLICY "Questions are viewable by everyone" ON public.crazy_questions
  FOR SELECT USING (true);

INSERT INTO public.crazy_questions (category, question, stat_key, emoji, auto_calculable) VALUES
  ('Volumen de juego', 'Total de tiros de esquina en la jornada',              'total_corners',          '🚩', FALSE),
  ('Volumen de juego', 'Total de tiros al arco (incluyendo bloqueados)',        'total_shots',            '🎯', FALSE),
  ('Volumen de juego', 'Total de pases fallados en la jornada',                 'total_missed_passes',    '❌', FALSE),
  ('Disciplina',       'Total de tarjetas amarillas',                           'total_yellow_cards',     '🟨', TRUE),
  ('Disciplina',       'Total de faltas cobradas',                              'total_fouls',            '🦵', FALSE),
  ('Disciplina',       'Minutos totales de tiempo añadido (suma de partidos)',  'total_added_time',       '⏱️', FALSE),
  ('Goles',            'Total de goles en la jornada',                          'total_goals',            '⚽', TRUE),
  ('Goles',            'Minuto promedio del primer gol de cada partido',        'avg_first_goal_minute',  '⏰', TRUE),
  ('Goles',            'Cantidad de goles en tiempo añadido',                   'goals_in_added_time',    '⚡', TRUE),
  ('Rareza máxima',    'Cantidad de goles de cabeza',                           'header_goals',           '🤕', FALSE),
  ('Rareza máxima',    'Cantidad de autogoles en la jornada',                   'own_goals',              '🙈', TRUE),
  ('Rareza máxima',    'Número total de penaltis cobrados',                     'total_penalties',        '🥅', TRUE),
  ('Rareza máxima',    'Jugadores que entraron como sustitutos (total)',         'total_substitutions',    '🔄', TRUE)
ON CONFLICT (stat_key) DO NOTHING;

-- Jornadas (una por fecha con partidos)
CREATE TABLE IF NOT EXISTS public.crazy_jornadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jornada_date DATE NOT NULL UNIQUE,
  question_id UUID REFERENCES public.crazy_questions(id) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  first_match_at TIMESTAMPTZ NOT NULL,
  real_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.crazy_jornadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jornadas are viewable by everyone" ON public.crazy_jornadas;
DROP POLICY IF EXISTS "Service role can manage jornadas" ON public.crazy_jornadas;

CREATE POLICY "Jornadas are viewable by everyone" ON public.crazy_jornadas
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert jornadas" ON public.crazy_jornadas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update jornadas" ON public.crazy_jornadas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Respuestas de usuarios
CREATE TABLE IF NOT EXISTS public.crazy_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  jornada_id UUID REFERENCES public.crazy_jornadas(id) ON DELETE CASCADE NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0),
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  answered_before_deadline BOOLEAN DEFAULT FALSE NOT NULL,
  points INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(user_id, jornada_id)
);

ALTER TABLE public.crazy_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Answers are viewable by everyone" ON public.crazy_answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON public.crazy_answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON public.crazy_answers;

CREATE POLICY "Answers are viewable by everyone" ON public.crazy_answers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own answers" ON public.crazy_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers" ON public.crazy_answers
  FOR UPDATE USING (auth.uid() = user_id);
