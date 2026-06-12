-- Migración: añadir last_match_date a crazy_jornadas
-- Permite que una jornada abarque varios días (ej: 24 partidos de la primera vuelta del Mundial)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Añadir columna
ALTER TABLE public.crazy_jornadas
ADD COLUMN IF NOT EXISTS last_match_date DATE;

-- 2. Corregir la pregunta de la jornada actual: cambiar sustitutos → goles de cabeza
UPDATE public.crazy_jornadas
SET question_id = (
  SELECT id FROM public.crazy_questions WHERE stat_key = 'header_goals'
)
WHERE question_id = (
  SELECT id FROM public.crazy_questions WHERE stat_key = 'total_substitutions'
);
