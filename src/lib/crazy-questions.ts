export interface CrazyQuestion {
  id: string;
  category: string;
  question: string;
  stat_key: string;
  emoji: string;
  auto_calculable: boolean;
}

export interface CrazyAnswer {
  user_id: string;
  value: number;
  answered_before_deadline: boolean;
}

export interface PointsResult {
  user_id: string;
  points: number;
  diff: number;
  bonuses: ('early' | 'unique_exact' | 'closest')[];
}

export function calcBasePoints(diff: number): number {
  if (diff === 0) return 10;
  if (diff === 1) return 6;
  if (diff === 2) return 3;
  if (diff === 3) return 1;
  return 0;
}

export function calcAllPoints(answers: CrazyAnswer[], realValue: number): PointsResult[] {
  if (answers.length === 0) return [];

  const withDiff = answers.map((a) => ({
    ...a,
    diff: Math.abs(a.value - realValue),
  }));

  const exactAnswers = withDiff.filter((a) => a.diff === 0);
  const minDiff = Math.min(...withDiff.map((a) => a.diff));
  const closestAnswers = withDiff.filter((a) => a.diff === minDiff);

  return withDiff.map((a) => {
    let points = calcBasePoints(a.diff);
    const bonuses: PointsResult['bonuses'] = [];

    if (a.answered_before_deadline) {
      points += 1;
      bonuses.push('early');
    }

    if (a.diff === 0 && exactAnswers.length === 1) {
      points += 5;
      bonuses.push('unique_exact');
    }

    if (a.diff === minDiff && closestAnswers.length === 1) {
      points += 2;
      bonuses.push('closest');
    }

    return { user_id: a.user_id, points, diff: a.diff, bonuses };
  });
}

export const CATEGORY_ORDER = ['Goles', 'Disciplina', 'Volumen de juego', 'Rareza máxima'];

export const STAT_LABELS: Record<string, string> = {
  total_corners: 'Tiros de esquina totales',
  total_shots: 'Tiros al arco totales',
  total_missed_passes: 'Pases fallados totales',
  total_yellow_cards: 'Tarjetas amarillas',
  total_fouls: 'Faltas cobradas',
  total_added_time: 'Min. de tiempo añadido',
  total_goals: 'Goles en la jornada',
  avg_first_goal_minute: 'Min. promedio 1er gol',
  goals_in_added_time: 'Goles en tiempo añadido',
  header_goals: 'Goles de cabeza',
  own_goals: 'Autogoles',
  total_penalties: 'Penaltis cobrados',
  total_substitutions: 'Sustitutos totales',
};
