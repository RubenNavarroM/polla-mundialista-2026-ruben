import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMatches } from "@/lib/api-football";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MatchListClient } from "./MatchListClient";
import type { Prediction } from "@/types/database";

// Primer partido: México vs Sudáfrica, 11 jun 2026 19:00 UTC
const FIRST_MATCH_DATE = "2026-06-11T19:00:00Z";

async function MatchList() {
  const [supabase, matches] = await Promise.all([
    createClient(),
    getMatches(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  let predictions: Prediction[] = [];
  if (user) {
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id);
    predictions = data ?? [];
  }

  const predMap = new Map(predictions.map((p) => [p.match_id, p]));
  return <MatchListClient matches={matches} predMap={predMap} />;
}

function MatchSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-border rounded w-1/3 mb-3" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-8 bg-border rounded-md" />
          <div className="h-3 bg-border rounded w-14" />
        </div>
        <div className="flex gap-2">
          <div className="w-12 h-12 bg-border rounded-xl" />
          <div className="w-4 h-12 bg-border rounded" />
          <div className="w-12 h-12 bg-border rounded-xl" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-8 bg-border rounded-md" />
          <div className="h-3 bg-border rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export default function PartidosPage() {
  const tournamentStarted = new Date() >= new Date(FIRST_MATCH_DATE);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Partidos ⚽</h1>
        <p className="text-text-secondary text-sm mt-1">
          Predice el marcador antes de que arranque cada partido
        </p>
      </div>

      {!tournamentStarted && (
        <CountdownTimer
          targetDate={FIRST_MATCH_DATE}
          label="Para el primer partido · México 🇲🇽 vs Sudáfrica 🇿🇦"
        />
      )}

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <MatchSkeleton key={i} />)}
          </div>
        }
      >
        <MatchList />
      </Suspense>
    </div>
  );
}
