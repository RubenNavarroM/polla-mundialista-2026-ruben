import { getMatches } from "@/lib/api-football";
import type { Match } from "@/types/api";

export const revalidate = 300;

const stageLabels: Record<string, string> = {
  round_of_32: "16avos de Final",
  round_of_16: "Octavos de Final",
  quarter_final: "Cuartos de Final",
  semi_final: "Semifinales",
  third_place: "Tercer Puesto",
  final: "Gran Final",
};

const stageOrder = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MatchRow({ match }: { match: Match }) {
  const done = match.status === "finished";
  const homeWon = done && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score;
  const awayWon = done && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score;

  return (
    <div className="card py-3 flex items-center gap-2">
      {/* Home */}
      <div className={`flex-1 flex items-center gap-2 min-w-0 ${awayWon ? "opacity-40" : ""}`}>
        {match.home_team.flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={match.home_team.flag} alt={match.home_team.name} className="w-6 h-4 rounded object-cover flex-shrink-0" />
        ) : null}
        <span className={`text-sm font-semibold truncate ${homeWon ? "text-secondary" : ""}`}>
          {match.home_team.name}
        </span>
      </div>

      {/* Score / status */}
      <div className="flex-shrink-0 text-center w-16">
        {match.status === "finished" ? (
          <span className="font-syne font-bold text-secondary">
            {match.home_score} – {match.away_score}
          </span>
        ) : match.status === "live" ? (
          <span className="flex items-center justify-center gap-1 text-xs font-bold text-error">
            <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
            VIVO
          </span>
        ) : (
          <span className="text-xs text-text-secondary leading-tight text-center">
            {formatDate(match.date)}
          </span>
        )}
      </div>

      {/* Away */}
      <div className={`flex-1 flex items-center justify-end gap-2 min-w-0 ${homeWon ? "opacity-40" : ""}`}>
        <span className={`text-sm font-semibold truncate text-right ${awayWon ? "text-secondary" : ""}`}>
          {match.away_team.name}
        </span>
        {match.away_team.flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={match.away_team.flag} alt={match.away_team.name} className="w-6 h-4 rounded object-cover flex-shrink-0" />
        ) : null}
      </div>
    </div>
  );
}

export default async function EliminatoriasPage() {
  const matches = await getMatches();

  const knockoutMatches = matches.filter((m) => stageOrder.includes(m.stage));

  const grouped = stageOrder.reduce(
    (acc, stage) => {
      const stageMatches = knockoutMatches
        .filter((m) => m.stage === stage)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (stageMatches.length > 0) acc.push({ stage, matches: stageMatches });
      return acc;
    },
    [] as { stage: string; matches: Match[] }[]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Eliminatorias 🗂️</h1>
        <p className="text-text-secondary text-sm mt-1">
          Cuadro de eliminatorias del Mundial 2026
        </p>
      </div>

      {grouped.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">⏳</p>
          <p className="font-semibold text-text-primary">Las eliminatorias aún no han comenzado</p>
          <p className="text-text-secondary text-sm mt-1">
            Los cruces se definirán al terminar la fase de grupos
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ stage, matches }) => (
            <div key={stage}>
              <h2 className="font-syne font-bold text-sm text-text-secondary uppercase tracking-wide mb-2 px-1">
                {stageLabels[stage] ?? stage}
              </h2>
              <div className="space-y-2">
                {matches.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
