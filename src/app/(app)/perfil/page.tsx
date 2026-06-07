import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatches } from "@/lib/api-football";
import { calcMatchPoints } from "@/lib/points";
import { signOut } from "@/app/auth/actions";
import { EditUsernameForm } from "./EditUsernameForm";
import { AvatarForm } from "./AvatarForm";
import { ShareButton } from "@/components/ShareButton";

const stageLabels: Record<string, string> = {
  group: "Grupos",
  round_of_16: "Octavos",
  quarter_final: "Cuartos",
  semi_final: "Semifinal",
  third_place: "3er Puesto",
  final: "Final",
};

export default async function PerfilPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: predictions }, matches] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("predictions").select("*").eq("user_id", user.id),
    getMatches(),
  ]);

  if (!profile) redirect("/auth/username");

  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const preds = predictions ?? [];

  // Calcula stats
  let totalPoints = 0;
  let exact = 0;
  let correct = 0;
  let played = 0;

  const predWithResult = preds.map((pred) => {
    const match = matchMap.get(pred.match_id);
    if (!match) return { pred, match: null, points: 0, status: "pending" as const };

    const isFinished = match.status === "finished";
    if (isFinished) {
      played++;
      const result = calcMatchPoints(match, pred);
      totalPoints += result.points;
      if (result.exact) exact++;
      else if (result.correct) correct++;

      return {
        pred,
        match,
        points: result.points,
        status: result.exact ? "exact" : result.correct ? "correct" : "wrong" as "exact" | "correct" | "wrong",
      };
    }

    return { pred, match, points: 0, status: "pending" as const };
  });

  const accuracy = played > 0 ? Math.round((correct + exact) / played * 100) : 0;

  const statusConfig = {
    exact:   { label: "Exacto 🎯",   bg: "bg-success/10",  text: "text-success",  pts: "+5" },
    correct: { label: "Correcto ✓",  bg: "bg-secondary/10", text: "text-secondary", pts: "+2" },
    wrong:   { label: "Incorrecto ✗", bg: "bg-error/10",   text: "text-error",    pts: "0"  },
    pending: { label: "Pendiente",   bg: "bg-surface",      text: "text-text-secondary", pts: "–" },
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header perfil */}
      <div className="card flex items-center gap-4">
        <AvatarForm current={profile.avatar_url} />
        <div className="flex-1 min-w-0">
          <EditUsernameForm current={profile.username} />
          <p className="text-text-secondary text-xs mt-1">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-text-secondary hover:text-error transition px-3 py-1.5 rounded-lg hover:bg-surface">
            Salir
          </button>
        </form>
      </div>

      {/* Compartir */}
      <div className="card">
        <p className="font-semibold text-text-primary text-sm mb-3">
          📲 Invita a tus amigos
        </p>
        <ShareButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Puntos totales", value: totalPoints, color: "text-primary" },
          { label: "Exactos 🎯",     value: exact,       color: "text-success" },
          { label: "Correctos ✓",   value: correct,     color: "text-secondary" },
          { label: "Precisión",      value: `${accuracy}%`, color: "text-text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <p className={`font-syne text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-text-secondary text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Lista de predicciones */}
      <div>
        <h2 className="font-syne text-lg font-bold text-secondary mb-3">
          Mis predicciones ({preds.length})
        </h2>

        {preds.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">⚽</p>
            <p className="text-text-secondary">Aún no has predicho ningún partido</p>
          </div>
        ) : (
          <div className="space-y-2">
            {predWithResult
              .sort((a, b) => {
                // Primero los terminados, luego pendientes
                const order = { exact: 0, correct: 1, wrong: 2, pending: 3 };
                return order[a.status] - order[b.status];
              })
              .map(({ pred, match, points, status }) => {
                const cfg = statusConfig[status];
                return (
                  <div
                    key={pred.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-border ${cfg.bg}`}
                  >
                    {/* Equipos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-text-primary">
                        {match
                          ? `${match.home_team.name} vs ${match.away_team.name}`
                          : `Partido #${pred.match_id}`}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {match ? stageLabels[match.stage] ?? match.stage : ""}
                      </p>
                    </div>

                    {/* Mi predicción */}
                    <div className="text-center flex-shrink-0">
                      <p className="text-xs text-text-secondary">Mi pred.</p>
                      <p className="font-mono font-bold text-sm text-text-primary">
                        {pred.home_score} – {pred.away_score}
                      </p>
                    </div>

                    {/* Resultado real (si hay) */}
                    {match?.status === "finished" && (
                      <div className="text-center flex-shrink-0">
                        <p className="text-xs text-text-secondary">Real</p>
                        <p className="font-mono font-bold text-sm text-secondary">
                          {match.home_score} – {match.away_score}
                        </p>
                      </div>
                    )}

                    {/* Status + puntos */}
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
        )}
      </div>
    </div>
  );
}
