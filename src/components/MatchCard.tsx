"use client";

import { useState, useTransition } from "react";
import { TeamFlag } from "./TeamFlag";
import { ConfettiEffect } from "./ConfettiEffect";
import { useToast } from "./Toast";
import { savePrediction } from "@/app/partidos/actions";
import type { Match } from "@/types/api";
import type { Prediction } from "@/types/database";

interface Props {
  match: Match;
  prediction?: Prediction;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
  };
}

const stageLabels: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_32: "16avos de Final",
  round_of_16: "Octavos de Final",
  quarter_final: "Cuartos de Final",
  semi_final: "Semifinal",
  third_place: "Tercer Puesto",
  final: "Final",
};

export function MatchCard({ match, prediction }: Props) {
  const [homeScore, setHomeScore] = useState(prediction?.home_score?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(prediction?.away_score?.toString() ?? "");
  const [saved, setSaved] = useState(!!prediction);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const kickoffPassed = new Date(match.date) <= new Date();
  const isLocked = match.status !== "scheduled" || kickoffPassed || prediction?.locked;
  const isLive = match.status === "live" || (kickoffPassed && match.status === "scheduled");
  const isFinished = match.status === "finished";
  const { date, time } = formatDate(match.date);

  function handleSave() {
    if (homeScore === "" || awayScore === "") return;
    const formData = new FormData();
    formData.set("match_id", match.id);
    formData.set("home_score", homeScore);
    formData.set("away_score", awayScore);

    startTransition(async () => {
      const result = await savePrediction(formData);
      if (!result?.error) {
        setSaved(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 100);
        toast("Predicción guardada 🎯", "success");
      } else {
        toast(result.error, "error");
      }
    });
  }

  const hasChanged =
    homeScore !== (prediction?.home_score?.toString() ?? "") ||
    awayScore !== (prediction?.away_score?.toString() ?? "");

  return (
    <>
    <ConfettiEffect trigger={showConfetti} type="correct" />
    <div className="card hover:shadow-card-hover transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-0.5 rounded-full">
          {match.group ?? stageLabels[match.stage]}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 text-xs font-bold text-error">
              <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
              EN VIVO
            </span>
          )}
          {isFinished && (
            <span className="text-xs text-text-secondary font-medium">Finalizado</span>
          )}
          {!isLive && !isFinished && (
            <span className="text-xs text-text-secondary">{date} · {time}</span>
          )}
        </div>
      </div>

      {/* Equipos y marcador */}
      <div className="flex items-center justify-between gap-2">
        {/* Local */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamFlag name={match.home_team.name} flag={match.home_team.flag} size="lg" />
        </div>

        {/* Centro: resultado real si terminó/en vivo, inputs si no */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isFinished ? (
            <div className="flex items-center gap-1.5 bg-secondary px-4 py-2 rounded-xl">
              <span className="font-syne text-2xl font-bold text-white">
                {match.home_score ?? 0}
              </span>
              <span className="text-white/60 font-bold">-</span>
              <span className="font-syne text-2xl font-bold text-white">
                {match.away_score ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={(e) => { setHomeScore(e.target.value); setSaved(false); }}
                disabled={!!isLocked}
                placeholder="–"
                className="w-12 h-12 text-center text-xl font-bold font-syne rounded-xl border-2 border-border bg-surface focus:border-primary focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition"
              />
              <span className="text-text-secondary font-bold text-lg">-</span>
              <input
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={(e) => { setAwayScore(e.target.value); setSaved(false); }}
                disabled={!!isLocked}
                placeholder="–"
                className="w-12 h-12 text-center text-xl font-bold font-syne rounded-xl border-2 border-border bg-surface focus:border-primary focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition"
              />
            </div>
          )}
        </div>

        {/* Visitante */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamFlag name={match.away_team.name} flag={match.away_team.flag} size="lg" />
        </div>
      </div>

      {/* Predicción del usuario si hay resultado */}
      {isFinished && prediction && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs text-text-secondary">Tu predicción:</span>
          <span className="text-xs font-bold font-mono bg-surface px-2 py-0.5 rounded">
            {prediction.home_score} - {prediction.away_score}
          </span>
        </div>
      )}

      {/* Botón guardar / estado */}
      {!isFinished && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs">
            {isLocked ? (
              <span className="text-text-secondary flex items-center gap-1">🔒 Bloqueado</span>
            ) : saved && !hasChanged ? (
              <span className="text-success flex items-center gap-1">✓ Predicho</span>
            ) : (
              <span className="text-text-secondary">Pendiente</span>
            )}
          </div>
          {!isLocked && (
            <button
              onClick={handleSave}
              disabled={isPending || homeScore === "" || awayScore === "" || (!hasChanged && saved)}
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {isPending ? "Guardando..." : saved && !hasChanged ? "Guardado ✓" : "Guardar"}
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}
