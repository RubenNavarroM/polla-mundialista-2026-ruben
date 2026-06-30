import type { Match } from "@/types/api";

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
