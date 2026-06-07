import type { Match } from "@/types/api";
import type { Prediction, BracketPrediction } from "@/types/database";

export interface UserScore {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  exact_scores: number;
  correct_results: number;
  rank: number;
}

function matchResult(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

export function calcMatchPoints(
  match: Match,
  prediction: Prediction
): { points: number; exact: boolean; correct: boolean } {
  if (match.status !== "finished") return { points: 0, exact: false, correct: false };
  if (match.home_score === null || match.away_score === null) return { points: 0, exact: false, correct: false };

  const realHome = match.home_score;
  const realAway = match.away_score;
  const predHome = prediction.home_score;
  const predAway = prediction.away_score;

  const exact = realHome === predHome && realAway === predAway;
  if (exact) return { points: 5, exact: true, correct: true };

  const correct = matchResult(realHome, realAway) === matchResult(predHome, predAway);
  if (correct) return { points: 2, exact: false, correct: true };

  return { points: 0, exact: false, correct: false };
}

export function calcLeaderboard(
  profiles: { id: string; username: string; avatar_url: string | null }[],
  predictions: Prediction[],
  finishedMatches: Match[],
  brackets: BracketPrediction[],
  champion: string | null,
  runnerUp: string | null
): UserScore[] {
  const matchMap = new Map(finishedMatches.map((m) => [m.id, m]));
  const bracketMap = new Map(brackets.map((b) => [b.user_id, b]));

  const scores: UserScore[] = profiles.map((profile) => {
    const userPreds = predictions.filter((p) => p.user_id === profile.id);
    let total = 0;
    let exact = 0;
    let correct = 0;

    for (const pred of userPreds) {
      const match = matchMap.get(pred.match_id);
      if (!match) continue;
      const result = calcMatchPoints(match, pred);
      total += result.points;
      if (result.exact) exact++;
      else if (result.correct) correct++;
    }

    // Bonus bracket
    const bracket = bracketMap.get(profile.id);
    if (bracket && champion) {
      if (bracket.champion_team === champion) total += 10;
      if (bracket.runner_up === runnerUp) total += 5;
    }

    return {
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      total_points: total,
      exact_scores: exact,
      correct_results: correct,
      rank: 0,
    };
  });

  scores.sort((a, b) => b.total_points - a.total_points || a.username.localeCompare(b.username));
  scores.forEach((s, i) => (s.rank = i + 1));

  return scores;
}
