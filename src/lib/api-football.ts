import type { Match, Team, MatchStage, MatchStatus } from "@/types/api";

const BASE_URL = "https://api.football-data.org/v4";

const headers = {
  "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY!,
};

function parseStage(stage: string, group: string | null): MatchStage {
  if (group) return "group";
  const s = stage.toUpperCase();
  if (s.includes("GROUP")) return "group";
  if (s.includes("LAST_16") || s.includes("ROUND_OF_16")) return "round_of_16";
  if (s.includes("QUARTER")) return "quarter_final";
  if (s.includes("SEMI")) return "semi_final";
  if (s.includes("THIRD")) return "third_place";
  if (s.includes("FINAL")) return "final";
  return "group";
}

function parseStatus(status: string): MatchStatus {
  if (["IN_PLAY", "PAUSED", "HALFTIME"].includes(status)) return "live";
  if (["FINISHED", "AWARDED"].includes(status)) return "finished";
  return "scheduled"; // TIMED, SCHEDULED, etc.
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMatch(m: any): Match {
  const home: Team = {
    id: String(m.homeTeam.id ?? "0"),
    name: m.homeTeam.name ?? "Por definir",
    code: m.homeTeam.tla ?? m.homeTeam.shortName?.slice(0, 3).toUpperCase() ?? "TBD",
    flag: m.homeTeam.crest ?? "",
  };
  const away: Team = {
    id: String(m.awayTeam.id ?? "0"),
    name: m.awayTeam.name ?? "Por definir",
    code: m.awayTeam.tla ?? m.awayTeam.shortName?.slice(0, 3).toUpperCase() ?? "TBD",
    flag: m.awayTeam.crest ?? "",
  };

  return {
    id: String(m.id),
    home_team: home,
    away_team: away,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    date: m.utcDate,
    venue: m.venue ?? "",
    city: "",
    stage: parseStage(m.stage, m.group),
    status: parseStatus(m.status),
    group: m.group ?? undefined,
  };
}

export async function getMatches(): Promise<Match[]> {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`);

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.matches ?? []).map((m: any) => mapMatch(m));
}

export async function getLiveMatches(): Promise<Match[]> {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches?status=IN_PLAY`, {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.matches ?? []).map((m: any) => mapMatch(m));
}

export interface GroupStanding {
  group: string;
  position: number;
  team: Team;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export async function getStandings(): Promise<GroupStanding[]> {
  const res = await fetch(`${BASE_URL}/competitions/WC/standings`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  const data = await res.json();

  const result: GroupStanding[] = [];
  for (const standing of data.standings ?? []) {
    const group: string = standing.group ?? "GROUP_A";
    for (const row of standing.table ?? []) {
      result.push({
        group,
        position: row.position,
        team: {
          id: String(row.team.id),
          name: row.team.name ?? "Por definir",
          code: row.team.tla ?? "???",
          flag: row.team.crest ?? "",
        },
        played: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        points: row.points,
      });
    }
  }
  return result;
}

export async function getMatch(id: string): Promise<Match | null> {
  const res = await fetch(`${BASE_URL}/matches/${id}`, {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return mapMatch(data);
}

export interface MatchGoal {
  minute: number;
  type: "REGULAR" | "OWN_GOAL" | "PENALTY" | "MISSED_PENALTY";
  team: { id: string; name: string };
}

export interface MatchBooking {
  minute: number;
  type: "YELLOW_CARD" | "RED_CARD";
  team: { id: string; name: string };
}

export interface MatchSubstitution {
  minute: number;
  team: { id: string; name: string };
}

export interface MatchFullDetail extends Match {
  goals: MatchGoal[];
  bookings: MatchBooking[];
  substitutions: MatchSubstitution[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGoal(g: any): MatchGoal {
  return {
    minute: g.minute ?? 0,
    type: g.type ?? "REGULAR",
    team: { id: String(g.team?.id ?? 0), name: g.team?.name ?? "" },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBooking(b: any): MatchBooking {
  return {
    minute: b.minute ?? 0,
    type: b.type ?? "YELLOW_CARD",
    team: { id: String(b.team?.id ?? 0), name: b.team?.name ?? "" },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubstitution(s: any): MatchSubstitution {
  return {
    minute: s.minute ?? 0,
    team: { id: String(s.team?.id ?? 0), name: s.team?.name ?? "" },
  };
}

export async function getMatchFullDetail(id: string): Promise<MatchFullDetail | null> {
  const res = await fetch(`${BASE_URL}/matches/${id}`, {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;
  const data = await res.json();

  return {
    ...mapMatch(data),
    goals: (data.goals ?? []).map(mapGoal),
    bookings: (data.bookings ?? []).map(mapBooking),
    substitutions: (data.substitutions ?? []).map(mapSubstitution),
  };
}
