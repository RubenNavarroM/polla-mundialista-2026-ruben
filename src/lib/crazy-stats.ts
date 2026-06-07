import { getMatchFullDetail } from "./api-football";
import type { Match } from "@/types/api";

export async function calcLiveStat(statKey: string, matches: Match[]): Promise<number | null> {
  const inPlayOrFinished = matches.filter((m) => m.status !== "scheduled");

  switch (statKey) {
    case "total_goals":
      return matches.reduce((sum, m) => sum + (m.home_score ?? 0) + (m.away_score ?? 0), 0);

    case "total_yellow_cards": {
      const details = await Promise.all(inPlayOrFinished.map((m) => getMatchFullDetail(m.id)));
      const valid = details.filter(Boolean);
      if (valid.length === 0) return null;
      return valid.reduce((sum, d) => sum + d!.bookings.filter((b) => b.type === "YELLOW_CARD").length, 0);
    }

    case "goals_in_added_time": {
      const details = await Promise.all(inPlayOrFinished.map((m) => getMatchFullDetail(m.id)));
      const valid = details.filter(Boolean);
      if (valid.length === 0) return null;
      return valid.reduce((sum, d) => sum + d!.goals.filter((g) => g.minute > 90).length, 0);
    }

    case "own_goals": {
      const details = await Promise.all(inPlayOrFinished.map((m) => getMatchFullDetail(m.id)));
      const valid = details.filter(Boolean);
      if (valid.length === 0) return null;
      return valid.reduce((sum, d) => sum + d!.goals.filter((g) => g.type === "OWN_GOAL").length, 0);
    }

    case "total_penalties": {
      const details = await Promise.all(inPlayOrFinished.map((m) => getMatchFullDetail(m.id)));
      const valid = details.filter(Boolean);
      if (valid.length === 0) return null;
      return valid.reduce((sum, d) => sum + d!.goals.filter((g) => g.type === "PENALTY").length, 0);
    }

    case "total_substitutions": {
      const details = await Promise.all(inPlayOrFinished.map((m) => getMatchFullDetail(m.id)));
      const valid = details.filter(Boolean);
      if (valid.length === 0) return null;
      return valid.reduce((sum, d) => sum + d!.substitutions.length, 0);
    }

    case "avg_first_goal_minute": {
      const details = await Promise.all(inPlayOrFinished.map((m) => getMatchFullDetail(m.id)));
      const valid = details.filter(Boolean);
      if (valid.length === 0) return null;
      const firstMinutes = valid
        .map((d) => d!.goals.filter((g) => g.type !== "OWN_GOAL")[0]?.minute ?? null)
        .filter((m): m is number => m !== null);
      if (firstMinutes.length === 0) return null;
      return Math.round(firstMinutes.reduce((a, b) => a + b, 0) / firstMinutes.length);
    }

    default:
      return null;
  }
}
