export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          home_score: number;
          away_score: number;
          locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          home_score: number;
          away_score: number;
          locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          home_score?: number;
          away_score?: number;
          locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bracket_predictions: {
        Row: {
          id: string;
          user_id: string;
          champion_team: string | null;
          runner_up: string | null;
          third_place: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          champion_team?: string | null;
          runner_up?: string | null;
          third_place?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          champion_team?: string | null;
          runner_up?: string | null;
          third_place?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crazy_questions: {
        Row: {
          id: string;
          category: string;
          question: string;
          stat_key: string;
          emoji: string;
          auto_calculable: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          question: string;
          stat_key: string;
          emoji?: string;
          auto_calculable?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          question?: string;
          stat_key?: string;
          emoji?: string;
          auto_calculable?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      crazy_jornadas: {
        Row: {
          id: string;
          jornada_date: string;
          question_id: string;
          deadline: string;
          first_match_at: string;
          real_value: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          jornada_date: string;
          question_id: string;
          deadline: string;
          first_match_at: string;
          real_value?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          jornada_date?: string;
          question_id?: string;
          deadline?: string;
          first_match_at?: string;
          real_value?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      crazy_answers: {
        Row: {
          id: string;
          user_id: string;
          jornada_id: string;
          value: number;
          submitted_at: string;
          answered_before_deadline: boolean;
          points: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          jornada_id: string;
          value: number;
          submitted_at?: string;
          answered_before_deadline?: boolean;
          points?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          jornada_id?: string;
          value?: number;
          submitted_at?: string;
          answered_before_deadline?: boolean;
          points?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          total_points: number;
          exact_scores: number;
          correct_results: number;
          rank: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type BracketPrediction = Database["public"]["Tables"]["bracket_predictions"]["Row"];
export type LeaderboardEntry = Database["public"]["Views"]["leaderboard"]["Row"];

// ——— Predicciones Locas ———

export interface CrazyQuestion {
  id: string;
  category: string;
  question: string;
  stat_key: string;
  emoji: string;
  auto_calculable: boolean;
  created_at: string;
}

export interface CrazyJornada {
  id: string;
  jornada_date: string;
  question_id: string;
  deadline: string;
  first_match_at: string;
  real_value: number | null;
  created_at: string;
}

export interface CrazyJornadaWithQuestion extends CrazyJornada {
  crazy_questions: CrazyQuestion;
}

export interface CrazyAnswer {
  id: string;
  user_id: string;
  jornada_id: string;
  value: number;
  submitted_at: string;
  answered_before_deadline: boolean;
  points: number;
}

export interface CrazyAnswerWithProfile extends CrazyAnswer {
  profiles: { username: string; avatar_url: string | null };
}

export type JornadaStatus = "open" | "locked" | "pending_result" | "finished";

export function getJornadaStatus(
  jornada: CrazyJornada,
  jornadaMatches: { status: string }[]
): JornadaStatus {
  const now = new Date();
  const deadline = new Date(jornada.deadline);

  if (now < deadline) return "open";

  const allFinished = jornadaMatches.length > 0 && jornadaMatches.every((m) => m.status === "finished");

  if (allFinished && jornada.real_value !== null) return "finished";
  if (allFinished && jornada.real_value === null) return "pending_result";
  return "locked";
}
