import { getMatches } from "@/lib/api-football";
import { EliminatoriasClient } from "./EliminatoriasClient";
import type { MatchesByStage } from "./EliminatoriasClient";

export const revalidate = 300;

const KNOCKOUT_STAGES = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
] as const;

export default async function EliminatoriasPage() {
  const matches = await getMatches();

  const matchesByStage: MatchesByStage = {};

  for (const stage of KNOCKOUT_STAGES) {
    const stageMatches = matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (stageMatches.length > 0) {
      (matchesByStage as Record<string, typeof stageMatches>)[stage] = stageMatches;
    }
  }

  const hasMatches = Object.keys(matchesByStage).length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-syne text-2xl font-bold text-secondary">Eliminatorias 🗂️</h1>
        <p className="text-text-secondary text-sm mt-1">
          Cuadro de eliminatorias del Mundial 2026
        </p>
      </div>

      {!hasMatches ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⏳</p>
          <p className="font-semibold text-text-primary">Las eliminatorias aún no han comenzado</p>
          <p className="text-text-secondary text-sm mt-1">
            Los cruces se definirán al terminar la fase de grupos
          </p>
        </div>
      ) : (
        <EliminatoriasClient matchesByStage={matchesByStage} />
      )}
    </div>
  );
}
