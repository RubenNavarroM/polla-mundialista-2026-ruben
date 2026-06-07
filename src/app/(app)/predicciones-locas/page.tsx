import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatches } from "@/lib/api-football";
import { calcLiveStat } from "@/lib/crazy-stats";
import { calcAllPoints } from "@/lib/crazy-questions";
import { getJornadaStatus } from "@/types/database";
import type {
  CrazyJornadaWithQuestion,
  CrazyAnswerWithProfile,
  CrazyAnswer,
} from "@/types/database";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CrazyAnswerForm } from "./CrazyAnswerForm";
import { CrazyCountdown } from "./CrazyCountdown";
import { AdminUpdateForm } from "./AdminUpdateForm";

export const revalidate = 60;

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const STATUS_CONFIG = {
  open: { label: "Abierta", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  locked: { label: "En juego", color: "text-primary", bg: "bg-primary/10", dot: "bg-primary" },
  pending_result: { label: "Calculando...", color: "text-accent", bg: "bg-accent/10", dot: "bg-accent" },
  finished: { label: "Finalizada", color: "text-text-secondary", bg: "bg-surface", dot: "bg-text-secondary" },
};

function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) return <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">🎯 Exacto</span>;
  if (diff <= 1) return <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">±{diff}</span>;
  if (diff <= 2) return <span className="text-xs font-semibold text-text-primary bg-surface px-2 py-0.5 rounded-full">±{diff}</span>;
  if (diff <= 3) return <span className="text-xs text-text-secondary bg-surface px-2 py-0.5 rounded-full">±{diff}</span>;
  return <span className="text-xs text-error/70 bg-error/5 px-2 py-0.5 rounded-full">±{diff}</span>;
}

export default async function PrediccionesLocasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/auth/username");

  // Admin check
  const { data: { user: fullUser } } = await supabase.auth.getUser();
  const isAdmin = !!process.env.ADMIN_EMAIL && fullUser?.email === process.env.ADMIN_EMAIL;

  const matches = await getMatches();
  const today = new Date().toISOString().split("T")[0];

  // Group match dates (upcoming or today)
  const upcomingDates = Array.from(
    new Set(
      matches
        .filter((m) => m.date >= today + "T00:00:00Z")
        .map((m) => m.date.split("T")[0])
    )
  ).sort();

  // Target date for current jornada: today if matches, else next upcoming
  const targetDate = upcomingDates[0] ?? null;

  // Get or create jornada for target date
  let currentJornada: CrazyJornadaWithQuestion | null = null;

  if (targetDate) {
    const firstMatchOfDate = matches
      .filter((m) => m.date.startsWith(targetDate))
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    if (firstMatchOfDate) {
      // Try to get existing first
      const { data: existing } = await supabase
        .from("crazy_jornadas")
        .select("*, crazy_questions(*)")
        .eq("jornada_date", targetDate)
        .maybeSingle();

      if (existing) {
        currentJornada = existing as unknown as CrazyJornadaWithQuestion;
      } else {
        // Create new jornada
        const firstMatchAt = firstMatchOfDate.date;
        const deadline = new Date(new Date(firstMatchAt).getTime() - 30 * 60 * 1000).toISOString();

        const { data: usedJornadas } = await supabase
          .from("crazy_jornadas")
          .select("question_id");
        const usedIds = new Set((usedJornadas ?? []).map((j: { question_id: string }) => j.question_id));

        const { data: allQuestions } = await supabase
          .from("crazy_questions")
          .select("*");

        let available = (allQuestions ?? []).filter((q: { id: string }) => !usedIds.has(q.id));
        if (available.length === 0) available = allQuestions ?? [];

        if (available.length > 0) {
          const question = available[Math.floor(Math.random() * available.length)];
          const { data: newJ } = await supabase
            .from("crazy_jornadas")
            .insert({
              jornada_date: targetDate,
              question_id: question.id,
              deadline,
              first_match_at: firstMatchAt,
            })
            .select("*, crazy_questions(*)")
            .single();
          if (newJ) currentJornada = newJ as unknown as CrazyJornadaWithQuestion;
        }

        // Fallback: race condition — try to read again
        if (!currentJornada) {
          const { data: raceRead } = await supabase
            .from("crazy_jornadas")
            .select("*, crazy_questions(*)")
            .eq("jornada_date", targetDate)
            .maybeSingle();
          if (raceRead) currentJornada = raceRead as unknown as CrazyJornadaWithQuestion;
        }
      }
    }
  }

  // If no upcoming jornada, fall back to most recent past one
  if (!currentJornada) {
    const { data: latest } = await supabase
      .from("crazy_jornadas")
      .select("*, crazy_questions(*)")
      .order("jornada_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) currentJornada = latest as unknown as CrazyJornadaWithQuestion;
  }

  // Fetch historical jornadas
  const { data: allJornadas } = await supabase
    .from("crazy_jornadas")
    .select("*, crazy_questions(*)")
    .order("jornada_date", { ascending: false })
    .limit(20);

  const jornadas = (allJornadas ?? []) as unknown as CrazyJornadaWithQuestion[];

  // Current jornada details
  let currentAnswers: CrazyAnswerWithProfile[] = [];
  let myAnswer: CrazyAnswer | null = null;
  let liveStatValue: number | null = null;
  let jornadaStatus: ReturnType<typeof getJornadaStatus> = "open";

  if (currentJornada) {
    const jornadaMatches = matches.filter(
      (m) => m.date.startsWith(currentJornada!.jornada_date)
    );
    jornadaStatus = getJornadaStatus(currentJornada, jornadaMatches);

    const [{ data: answers }, { data: myAns }] = await Promise.all([
      supabase
        .from("crazy_answers")
        .select("*, profiles(username, avatar_url)")
        .eq("jornada_id", currentJornada.id)
        .order("value"),
      supabase
        .from("crazy_answers")
        .select("*")
        .eq("jornada_id", currentJornada.id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    currentAnswers = (answers ?? []) as unknown as CrazyAnswerWithProfile[];
    myAnswer = myAns ?? null;

    // Calculate live stat if in play or finished and auto-calculable
    const question = currentJornada.crazy_questions;
    if (
      (jornadaStatus === "locked" || jornadaStatus === "pending_result" || jornadaStatus === "finished") &&
      question.auto_calculable
    ) {
      liveStatValue = await calcLiveStat(question.stat_key, jornadaMatches);
      // If jornada is pending and we got a value, use it as real_value display
      if (jornadaStatus === "pending_result" && liveStatValue !== null) {
        liveStatValue = liveStatValue;
      }
    }

    // If finished with real_value set, use that
    if (jornadaStatus === "finished" && currentJornada.real_value !== null) {
      liveStatValue = currentJornada.real_value;
    }
  }

  // Points preview for live results display
  const pointsPreview =
    liveStatValue !== null && currentAnswers.length > 0
      ? calcAllPoints(
          currentAnswers.map((a) => ({
            user_id: a.user_id,
            value: a.value,
            answered_before_deadline: a.answered_before_deadline,
          })),
          liveStatValue
        )
      : [];
  const pointsMap = new Map(pointsPreview.map((p) => [p.user_id, p]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <AutoRefresh intervalMs={60000} />

      {/* Header */}
      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Predicciones Locas 🎲</h1>
        <p className="text-text-secondary text-sm mt-1">
          Adivina la estadística rara de cada jornada · Hasta 15 pts por jornada
        </p>
      </div>

      {/* Current jornada card */}
      {currentJornada ? (
        <div className="card space-y-5">
          {/* Jornada header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-0.5">
                {currentJornada.crazy_questions.category}
              </p>
              <h2 className="font-syne text-xl font-bold text-secondary leading-tight">
                {currentJornada.crazy_questions.emoji}{" "}
                {currentJornada.crazy_questions.question}
              </h2>
              <p className="text-xs text-text-secondary mt-1.5">
                📅 {formatDate(currentJornada.jornada_date)}
              </p>
            </div>
            <div className="flex-shrink-0">
              {(() => {
                const cfg = STATUS_CONFIG[jornadaStatus];
                return (
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* State-specific content */}

          {jornadaStatus === "open" && (
            <div className="space-y-5">
              <CrazyCountdown deadline={currentJornada.deadline} />
              <CrazyAnswerForm
                jornadaId={currentJornada.id}
                currentValue={myAnswer?.value}
                question={currentJornada.crazy_questions.question}
                emoji={currentJornada.crazy_questions.emoji}
              />
              {myAnswer != null && (
                <div className="text-center">
                  <p className="text-xs text-text-secondary">Tu predicción actual</p>
                  <p className="font-syne text-3xl font-bold text-primary">{myAnswer.value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {myAnswer.answered_before_deadline ? "✓ antes del límite (+1 pt)" : ""}
                  </p>
                </div>
              )}
              {currentAnswers.length > 0 && (
                <p className="text-center text-xs text-text-secondary">
                  {currentAnswers.length} participante{currentAnswers.length !== 1 ? "s" : ""} han predicho
                </p>
              )}
            </div>
          )}

          {(jornadaStatus === "locked" || jornadaStatus === "pending_result") && (
            <div className="space-y-4">
              <div className="bg-surface rounded-2xl p-4 text-center">
                <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-1">
                  {currentJornada.crazy_questions.emoji} Stat actual
                </p>
                <p className="font-syne text-5xl font-bold text-secondary">
                  {liveStatValue !== null ? liveStatValue : "—"}
                </p>
                {liveStatValue === null && (
                  <p className="text-xs text-text-secondary mt-1">
                    {currentJornada.crazy_questions.auto_calculable
                      ? "Calculando cuando inicien los partidos..."
                      : "Actualización manual pendiente"}
                  </p>
                )}
              </div>

              {myAnswer != null && (
                <div className="flex items-center justify-between bg-primary/5 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-xs text-text-secondary">Tu predicción</p>
                    <p className="font-syne text-2xl font-bold text-primary">{myAnswer.value}</p>
                  </div>
                  {liveStatValue !== null && (
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Diferencia</p>
                      <DiffBadge diff={Math.abs(myAnswer.value - liveStatValue)} />
                    </div>
                  )}
                </div>
              )}

              {!myAnswer && (
                <p className="text-center text-sm text-text-secondary bg-surface rounded-2xl p-4">
                  No enviaste predicción para esta jornada
                </p>
              )}

              {isAdmin && (
                <AdminUpdateForm
                  jornadaId={currentJornada.id}
                  currentRealValue={currentJornada.real_value}
                  statKey={currentJornada.crazy_questions.stat_key}
                />
              )}

              {/* All answers live view */}
              {currentAnswers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Todas las predicciones ({currentAnswers.length})
                  </h3>
                  <div className="space-y-2">
                    {currentAnswers
                      .sort((a, b) => {
                        if (liveStatValue !== null) {
                          return Math.abs(a.value - liveStatValue) - Math.abs(b.value - liveStatValue);
                        }
                        return a.value - b.value;
                      })
                      .map((ans) => {
                        const diff = liveStatValue !== null ? Math.abs(ans.value - liveStatValue) : null;
                        const isMe = ans.user_id === user.id;
                        return (
                          <div
                            key={ans.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                              isMe ? "border-primary/30 bg-primary/5" : "border-border bg-white"
                            }`}
                          >
                            <span className="text-lg">{ans.profiles?.avatar_url ?? "👤"}</span>
                            <p className={`flex-1 text-sm font-semibold ${isMe ? "text-primary" : "text-text-primary"}`}>
                              {ans.profiles?.username ?? "Usuario"}
                              {isMe && <span className="ml-1 text-xs font-normal text-text-secondary">(tú)</span>}
                            </p>
                            <p className="font-syne text-xl font-bold text-text-primary tabular-nums">
                              {ans.value}
                            </p>
                            {diff !== null && <DiffBadge diff={diff} />}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {jornadaStatus === "finished" && (
            <div className="space-y-4">
              {/* Result */}
              <div className="bg-secondary rounded-2xl p-4 text-center">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                  {currentJornada.crazy_questions.emoji} Resultado final
                </p>
                <p className="font-syne text-6xl font-bold text-white">
                  {currentJornada.real_value}
                </p>
              </div>

              {/* My result */}
              {myAnswer != null && (() => {
                const myPoints = pointsMap.get(user.id);
                return (
                  <div className="flex items-center justify-between bg-surface rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-xs text-text-secondary">Tu predicción</p>
                      <p className="font-syne text-2xl font-bold text-text-primary">{myAnswer.value}</p>
                    </div>
                    <div className="text-right space-y-1">
                      {myPoints && <DiffBadge diff={myPoints.diff} />}
                      <p className="font-syne text-xl font-bold text-success">
                        +{myAnswer.points} pts
                      </p>
                      {myPoints && myPoints.bonuses.length > 0 && (
                        <div className="flex gap-1 justify-end flex-wrap">
                          {myPoints.bonuses.includes("unique_exact") && (
                            <span className="text-[10px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full">Único exacto +5</span>
                          )}
                          {myPoints.bonuses.includes("closest") && (
                            <span className="text-[10px] bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full">Más cercano +2</span>
                          )}
                          {myPoints.bonuses.includes("early") && (
                            <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded-full">A tiempo +1</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {!myAnswer && (
                <p className="text-center text-sm text-text-secondary bg-surface rounded-2xl p-4">
                  No participaste en esta jornada
                </p>
              )}

              {isAdmin && (
                <AdminUpdateForm
                  jornadaId={currentJornada.id}
                  currentRealValue={currentJornada.real_value}
                  statKey={currentJornada.crazy_questions.stat_key}
                />
              )}

              {/* Rankings */}
              {currentAnswers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Resultados de la jornada
                  </h3>
                  <div className="space-y-2">
                    {currentAnswers
                      .sort((a, b) => b.points - a.points || Math.abs(a.value - (currentJornada!.real_value ?? 0)) - Math.abs(b.value - (currentJornada!.real_value ?? 0)))
                      .map((ans, idx) => {
                        const isMe = ans.user_id === user.id;
                        const pts = pointsMap.get(ans.user_id);
                        return (
                          <div
                            key={ans.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                              isMe ? "border-primary/30 bg-primary/5" : "border-border bg-white"
                            }`}
                          >
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                              idx === 0 ? "bg-accent text-secondary" :
                              idx === 1 ? "bg-border text-text-primary" :
                              "bg-surface text-text-secondary"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-lg">{ans.profiles?.avatar_url ?? "👤"}</span>
                            <p className={`flex-1 text-sm font-semibold ${isMe ? "text-primary" : "text-text-primary"}`}>
                              {ans.profiles?.username ?? "Usuario"}
                              {isMe && <span className="ml-1 text-xs font-normal text-text-secondary">(tú)</span>}
                            </p>
                            <p className="font-mono text-sm text-text-secondary tabular-nums">
                              pred: {ans.value}
                            </p>
                            {pts && <DiffBadge diff={pts.diff} />}
                            <p className={`font-syne font-bold text-sm min-w-[44px] text-right ${ans.points > 0 ? "text-success" : "text-text-secondary"}`}>
                              +{ans.points}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🎲</p>
          <p className="font-semibold text-text-primary">No hay jornada activa</p>
          <p className="text-text-secondary text-sm mt-1">
            Las Predicciones Locas se activan automáticamente cuando hay partidos programados
          </p>
        </div>
      )}

      {/* Points guide */}
      <div className="card bg-surface border-0">
        <h3 className="font-syne font-bold text-sm text-text-primary mb-3">📋 Sistema de puntos</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-text-secondary">
          <span>🎯 Exacto</span>          <span className="font-bold text-text-primary">10 pts</span>
          <span>Diferencia ±1</span>      <span className="font-bold text-text-primary">6 pts</span>
          <span>Diferencia ±2</span>      <span className="font-bold text-text-primary">3 pts</span>
          <span>Diferencia ±3</span>      <span className="font-bold text-text-primary">1 pt</span>
          <span>Diferencia 4+</span>      <span className="text-text-secondary">0 pts</span>
          <span className="mt-1 pt-1 border-t border-border">Único exacto</span>
          <span className="mt-1 pt-1 border-t border-border font-bold text-accent">+5 bonus</span>
          <span>Más cercano</span>        <span className="font-bold text-secondary">+2 bonus</span>
          <span>Antes del límite</span>   <span className="font-bold text-success">+1 bonus</span>
        </div>
      </div>

      {/* History */}
      {jornadas.length > 1 && (
        <div>
          <h2 className="font-syne text-lg font-bold text-secondary mb-3">Historial</h2>
          <div className="space-y-2">
            {jornadas
              .filter((j) => j.id !== currentJornada?.id)
              .map(async (jornada) => {
                const jMatches = matches.filter((m) => m.date.startsWith(jornada.jornada_date));
                const status = getJornadaStatus(jornada, jMatches);

                const { data: userAns } = await supabase
                  .from("crazy_answers")
                  .select("value, points")
                  .eq("jornada_id", jornada.id)
                  .eq("user_id", user.id)
                  .maybeSingle();

                const { count } = await supabase
                  .from("crazy_answers")
                  .select("id", { count: "exact", head: true })
                  .eq("jornada_id", jornada.id);

                return (
                  <div key={jornada.id} className="card py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{jornada.crazy_questions.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {jornada.crazy_questions.question}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatShortDate(jornada.jornada_date)} · {count ?? 0} participantes
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {status === "finished" && jornada.real_value !== null ? (
                          <>
                            <p className="text-xs text-text-secondary">Resultado</p>
                            <p className="font-syne font-bold text-secondary">{jornada.real_value}</p>
                            {userAns != null ? (
                              <p className={`text-xs font-bold ${userAns.points > 0 ? "text-success" : "text-text-secondary"}`}>
                                {userAns.value} → +{userAns.points} pts
                              </p>
                            ) : (
                              <p className="text-xs text-text-secondary">No participé</p>
                            )}
                          </>
                        ) : (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color}`}>
                            {STATUS_CONFIG[status].label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
