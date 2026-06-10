import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatches } from "@/lib/api-football";
import { calcMatchPoints } from "@/lib/points";
import type { Match } from "@/types/api";

const stageLabels: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_16: "Octavos de Final",
  quarter_final: "Cuartos de Final",
  semi_final: "Semifinales",
  third_place: "3er y 4to Puesto",
  final: "Final",
};

const stageOrder = [
  "group",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
];

const statusConfig = {
  exact:   { label: "Exacto 🎯",    bg: "bg-success/10",   text: "text-success",        pts: "+5" },
  correct: { label: "Correcto ✓",   bg: "bg-secondary/10", text: "text-secondary",       pts: "+2" },
  wrong:   { label: "Incorrecto ✗", bg: "bg-error/10",     text: "text-error",           pts: "0"  },
  pending: { label: "Pendiente",    bg: "bg-surface",      text: "text-text-secondary",  pts: "–"  },
};

function getGroupKey(match: Match | null): string {
  if (!match) return "Sin partido";
  if (match.stage === "group" && match.group) return `Grupo ${match.group}`;
  return stageLabels[match.stage] ?? match.stage;
}

function getSortKey(match: Match | null): string {
  if (!match) return "zzz";
  if (match.stage === "group" && match.group) return `0_${match.group}`;
  const idx = stageOrder.indexOf(match.stage);
  return `1_${String(idx).padStart(2, "0")}`;
}

export default async function PrediccionesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: predictions }, matches] = await Promise.all([
    supabase.from("predictions").select("*").eq("user_id", user.id),
    getMatches(),
  ]);

  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const preds = predictions ?? [];

  const predWithResult = preds.map((pred) => {
    const match = matchMap.get(pred.match_id) ?? null;
    if (!match) return { pred, match, points: 0, status: "pending" as const };

    if (match.status === "finished") {
      const result = calcMatchPoints(match, pred);
      return {
        pred,
        match,
        points: result.points,
        status: (result.exact ? "exact" : result.correct ? "correct" : "wrong") as "exact" | "correct" | "wrong",
      };
    }

    return { pred, match, points: 0, status: "pending" as const };
  });

  // Group predictions
  const grouped = new Map<string, typeof predWithResult>();
  for (const item of predWithResult) {
    const key = getGroupKey(item.match);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  // Sort entries within each group: exact → correct → wrong → pending, then by date
  const statusOrder = { exact: 0, correct: 1, wrong: 2, pending: 3 };
  for (const items of grouped.values()) {
    items.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      const dateA = a.match?.date ?? "";
      const dateB = b.match?.date ?? "";
      return dateA.localeCompare(dateB);
    });
  }

  // Sort groups by stage order then group letter
  const sortedGroups = [...grouped.entries()].sort(([, itemsA], [, itemsB]) => {
    const keyA = getSortKey(itemsA[0]?.match ?? null);
    const keyB = getSortKey(itemsB[0]?.match ?? null);
    return keyA.localeCompare(keyB);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <a
          href="/perfil"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Perfil
        </a>
        <h1 className="font-syne text-xl font-bold text-secondary">
          Mis predicciones ({preds.length})
        </h1>
      </div>

      {preds.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">⚽</p>
          <p className="text-text-secondary">Aún no has predicho ningún partido</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([groupName, items]) => (
            <div key={groupName}>
              <h2 className="font-syne text-sm font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
                {groupName}
              </h2>
              <div className="space-y-2">
                {items.map(({ pred, match, points, status }) => {
                  const cfg = statusConfig[status];
                  return (
                    <div
                      key={pred.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-border ${cfg.bg}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-text-primary">
                          {match
                            ? `${match.home_team.name} vs ${match.away_team.name}`
                            : `Partido #${pred.match_id}`}
                        </p>
                        {match?.date && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            {new Date(match.date).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-center flex-shrink-0">
                        <p className="text-xs text-text-secondary">Mi pred.</p>
                        <p className="font-mono font-bold text-sm text-text-primary">
                          {pred.home_score} – {pred.away_score}
                        </p>
                      </div>
                      {match?.status === "finished" && (
                        <div className="text-center flex-shrink-0">
                          <p className="text-xs text-text-secondary">Real</p>
                          <p className="font-mono font-bold text-sm text-secondary">
                            {match.home_score} – {match.away_score}
                          </p>
                        </div>
                      )}
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
                        <p className={`font-syne font-bold text-sm ${points > 0 ? "text-success" : "text-text-secondary"}`}>
                          {status !== "pending" ? `${cfg.pts} pts` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
