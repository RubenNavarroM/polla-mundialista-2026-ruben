import { createClient } from "@/lib/supabase/server";
import { getMatches } from "@/lib/api-football";
import { BracketClient } from "./BracketClient";
import type { Team } from "@/types/api";

export const revalidate = 3600;

export default async function BracketPage() {
  const supabase = await createClient();

  const [
    matches,
    { data: { user } },
  ] = await Promise.all([
    getMatches(),
    supabase.auth.getUser(),
  ]);

  // Equipos únicos del torneo
  const teamMap = new Map<string, Team>();
  for (const m of matches) {
    if (m.home_team.name !== "Por definir") teamMap.set(m.home_team.id, m.home_team);
    if (m.away_team.name !== "Por definir") teamMap.set(m.away_team.id, m.away_team);
  }
  const teams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const knockoutStages = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"];
  const knockoutMatches = matches.filter((m) => knockoutStages.includes(m.stage));

  // ¿Ya empezaron los octavos?
  const knockoutsStarted = knockoutMatches.some(
    (m) => m.status === "live" || m.status === "finished"
  );

  let existing = null;
  if (user) {
    const { data } = await supabase
      .from("bracket_predictions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    existing = data;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-syne text-2xl font-bold text-secondary">Bracket 🗂️</h1>
        <p className="text-text-secondary text-sm mt-1">
          Predice tu podio y gana puntos bonus
        </p>
      </div>

      <BracketClient
        teams={teams}
        existing={existing}
        knockoutMatches={knockoutMatches}
        isLocked={knockoutsStarted}
      />
    </div>
  );
}
