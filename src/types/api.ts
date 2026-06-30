export interface Team {
  id: string;
  name: string;
  code: string;
  flag: string;
  group?: string;
}

export interface Match {
  id: string;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  penalties_home: number | null;
  penalties_away: number | null;
  date: string;
  venue: string;
  city: string;
  stage: MatchStage;
  status: MatchStatus;
  group?: string;
}

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type MatchStatus = "scheduled" | "live" | "finished";

export interface Standing {
  team: Team;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number;
}
