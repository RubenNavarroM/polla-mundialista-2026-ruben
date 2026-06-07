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
