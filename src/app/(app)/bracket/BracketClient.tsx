"use client";

import { useState, useTransition } from "react";
import { TeamSelector } from "@/components/TeamSelector";
import { saveBracketPrediction } from "./actions";
import type { Team, Match } from "@/types/api";
import type { BracketPrediction } from "@/types/database";

interface Props {
  teams: Team[];
  existing: BracketPrediction | null;
  knockoutMatches: Match[];
  isLocked: boolean;
}

const stageLabels: Record<string, string> = {
  round_of_16: "Octavos de Final",
  quarter_final: "Cuartos de Final",
  semi_final: "Semifinales",
  third_place: "Tercer Puesto",
  final: "Gran Final",
};

const stageOrder = ["round_of_16", "quarter_final", "semi_final", "third_place", "final"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function BracketClient({ teams, existing, knockoutMatches, isLocked }: Props) {
  const [champion, setChampion] = useState(existing?.champion_team ?? "");
  const [runnerUp, setRunnerUp] = useState(existing?.runner_up ?? "");
  const [thirdPlace, setThirdPlace] = useState(existing?.third_place ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(!!existing);
  const [isPending, startTransition] = useTransition();

  const hasChanged =
    champion !== (existing?.champion_team ?? "") ||
    runnerUp !== (existing?.runner_up ?? "") ||
    thirdPlace !== (existing?.third_place ?? "");

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await saveBracketPrediction(formData);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  // Agrupa partidos de eliminatorias por fase
  const grouped = stageOrder.reduce((acc, stage) => {
    const matches = knockoutMatches.filter((m) => m.stage === stage);
    if (matches.length > 0) acc.push({ stage, matches });
    return acc;
  }, [] as { stage: string; matches: Match[] }[]);

  return (
    <div className="space-y-6">
      {/* Predicción de podio */}
      <div className="card">
        <h2 className="font-syne text-lg font-bold text-secondary mb-1">
          🏆 Tu podio
        </h2>
        <p className="text-text-secondary text-sm mb-4">
          {isLocked
            ? "🔒 El bracket está bloqueado — ya iniciaron los octavos"
            : "Elige tus tres finalistas antes de que empiecen los octavos"}
        </p>

        {error && (
          <div className="bg-error/10 text-error text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-1.5">
                🥇 <span>Campeón</span>
                <span className="text-xs text-success font-normal ml-auto">+10 pts si aciertas</span>
              </label>
              <TeamSelector
                name="champion_team"
                teams={teams}
                value={champion}
                onChange={setChampion}
                placeholder="¿Quién levanta la copa?"
                exclude={[runnerUp, thirdPlace].filter(Boolean)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-1.5">
                🥈 <span>Subcampeón</span>
                <span className="text-xs text-success font-normal ml-auto">+5 pts si aciertas</span>
              </label>
              <TeamSelector
                name="runner_up"
                teams={teams}
                value={runnerUp}
                onChange={setRunnerUp}
                placeholder="Finalista perdedor"
                exclude={[champion, thirdPlace].filter(Boolean)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-1.5">
                🥉 <span>Tercer lugar</span>
              </label>
              <TeamSelector
                name="third_place"
                teams={teams}
                value={thirdPlace}
                onChange={setThirdPlace}
                placeholder="Ganador del tercer puesto"
                exclude={[champion, runnerUp].filter(Boolean)}
              />
            </div>
          </div>

          {!isLocked && (
            <button
              type="submit"
              disabled={isPending || !champion || (!hasChanged && saved)}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending
                ? "Guardando..."
                : saved && !hasChanged
                ? "Guardado ✓"
                : "Guardar predicción"}
            </button>
          )}
        </form>
      </div>

      {/* Árbol de eliminatorias */}
      {grouped.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-syne text-lg font-bold text-secondary px-1">
            🗂️ Eliminatorias
          </h2>
          {grouped.map(({ stage, matches }) => (
            <div key={stage}>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
                {stageLabels[stage] ?? stage}
              </h3>
              <div className="space-y-2">
                {matches.map((m) => (
                  <div key={m.id} className="card py-3 flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {m.home_team.flag ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.home_team.flag} alt={m.home_team.name} className="w-6 h-4 rounded object-cover flex-shrink-0" />
                      ) : null}
                      <span className="text-sm font-semibold truncate">{m.home_team.name}</span>
                    </div>

                    <div className="flex-shrink-0 text-center">
                      {m.status === "finished" ? (
                        <span className="font-syne font-bold text-secondary">
                          {m.home_score} – {m.away_score}
                        </span>
                      ) : m.status === "live" ? (
                        <span className="text-xs font-bold text-error flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
                          VIVO
                        </span>
                      ) : (
                        <span className="text-xs text-text-secondary">{formatDate(m.date)}</span>
                      )}
                    </div>

                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span className="text-sm font-semibold truncate text-right">{m.away_team.name}</span>
                      {m.away_team.flag ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.away_team.flag} alt={m.away_team.name} className="w-6 h-4 rounded object-cover flex-shrink-0" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-3xl mb-3">⏳</p>
          <p className="font-semibold text-text-primary">Los octavos se definen después de la fase de grupos</p>
          <p className="text-text-secondary text-sm mt-1">¡Guarda tu predicción de podio ahora!</p>
        </div>
      )}
    </div>
  );
}
