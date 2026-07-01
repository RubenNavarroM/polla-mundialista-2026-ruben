import type { Match, Team } from "@/types/api";

// Official 2026 World Cup bracket draw for round of 32.
// Each entry pairs two matches whose winners meet in the same round of 16 match.
// Teams identified by their TLA code (football-data.org standard).
// Source: openfootball/FIFA official draw
// M74+M77 → R16 M89, M73+M75 → R16 M90, M76+M78 → R16 M91, M79+M80 → R16 M92
// M83+M84 → R16 M93, M81+M82 → R16 M94, M86+M88 → R16 M95, M85+M87 → R16 M96
const R32_BRACKET_PAIRS: [[string, string], [string, string]][] = [
  [["GER", "PAR"], ["FRA", "SWE"]],
  [["RSA", "CAN"], ["NED", "MAR"]],
  [["BRA", "JPN"], ["CIV", "NOR"]],
  [["MEX", "ECU"], ["ENG", "COD"]],
  [["POR", "CRO"], ["ESP", "AUT"]],
  [["USA", "BIH"], ["BEL", "SEN"]],
  [["ARG", "CPV"], ["AUS", "EGY"]],
  [["SUI", "ALG"], ["COL", "GHA"]],
];

function matchHasCodes(match: Match, pair: [string, string]): boolean {
  const codes = new Set([match.home_team.code, match.away_team.code]);
  return pair.every((c) => codes.has(c));
}

export function getMatchWinner(match: Match): Team | null {
  if (match.status !== "finished") return null;
  if (match.home_score === null || match.away_score === null) return null;
  const hasPenalties = match.penalties_home !== null && match.penalties_away !== null;
  if (hasPenalties) {
    return match.penalties_home! > match.penalties_away! ? match.home_team : match.away_team;
  }
  if (match.home_score > match.away_score) return match.home_team;
  if (match.away_score > match.home_score) return match.away_team;
  return null;
}

// Each R16 slot maps two R32 feeder matches to one R16 match.
// r32Home: winner becomes home team in R16
// r32Away: winner becomes away team in R16
export interface R16Slot {
  r16Match: Match | null;
  r32Home: Match | null;
  r32Away: Match | null;
}

// Builds 8 R16 slots from available R32 and R16 matches.
// Slots that have no API match yet get r16Match = null.
export function buildR16Slots(r32Matches: Match[], r16Matches: Match[]): R16Slot[] {
  const orderedR32 = orderR32ByBracket(r32Matches);
  const sortedR16 = [...r16Matches].sort((a, b) => Number(a.id) - Number(b.id));
  return Array.from({ length: 8 }, (_, i) => ({
    r16Match: sortedR16[i] ?? null,
    r32Home: orderedR32[i * 2] ?? null,
    r32Away: orderedR32[i * 2 + 1] ?? null,
  }));
}

/**
 * Orders round-of-32 matches according to the official bracket draw,
 * so that consecutive pairs [0,1], [2,3], … feed into the same R16 match.
 * Unmatched matches (e.g. TBD teams) are appended at the end by ID.
 */
export function orderR32ByBracket(matches: Match[]): Match[] {
  const remaining = [...matches];
  const ordered: Match[] = [];

  for (const [pair1, pair2] of R32_BRACKET_PAIRS) {
    for (const teamPair of [pair1, pair2]) {
      const idx = remaining.findIndex((m) => matchHasCodes(m, teamPair));
      if (idx !== -1) {
        ordered.push(...remaining.splice(idx, 1));
      }
    }
  }

  // Safety net: append anything not matched, sorted by ID
  remaining.sort((a, b) => Number(a.id) - Number(b.id));
  ordered.push(...remaining);
  return ordered;
}
