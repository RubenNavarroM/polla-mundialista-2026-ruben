"use client";

import { useState, useMemo } from "react";
import { MatchCard } from "@/components/MatchCard";
import type { Match, MatchStage } from "@/types/api";
import type { Prediction } from "@/types/database";

type Filter = "todos" | "hoy" | "eliminatorias";

const filterLabels: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "hoy", label: "Hoy 🔴" },
  { key: "eliminatorias", label: "Eliminatorias" },
];

const knockoutStages: MatchStage[] = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"];

interface Props {
  matches: Match[];
  predMap: Map<string, Prediction>;
}

export function MatchListClient({ matches, predMap }: Props) {
  const [today] = useState(() => new Date().toDateString());
  const todayMatches = matches.filter((m) => new Date(m.date).toDateString() === today);
  const hasToday = todayMatches.length > 0;

  const [filter, setFilter] = useState<Filter>(hasToday ? "hoy" : "todos");

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "hoy") return new Date(m.date).toDateString() === today;
      if (filter === "eliminatorias") return knockoutStages.includes(m.stage);
      return true;
    });
  }, [matches, filter, today]);

  // Agrupa por fecha
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = new Date(m.date).toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      {/* Banner partidos de hoy */}
      {hasToday && filter !== "hoy" && (
        <button
          onClick={() => setFilter("hoy")}
          className="w-full mb-4 flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary font-semibold text-sm">
              {todayMatches.length} partido{todayMatches.length > 1 ? "s" : ""} hoy
            </span>
          </div>
          <span className="text-primary text-xs font-semibold">Ver →</span>
        </button>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {filterLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition flex-shrink-0 ${
              filter === key
                ? "bg-secondary text-white"
                : "bg-bg border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
            {key === "hoy" && hasToday && (
              <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                {todayMatches.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-text-secondary font-medium">
            {filter === "hoy" ? "No hay partidos hoy" : "No hay partidos en este filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateLabel, dayMatches]) => (
            <div key={dateLabel}>
              <h2 className="font-syne font-bold text-secondary capitalize text-sm mb-3 px-1 flex items-center gap-2">
                {dateLabel}
                {new Date(dayMatches[0].date).toDateString() === today && (
                  <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-normal">Hoy</span>
                )}
              </h2>
              <div className="space-y-3">
                {dayMatches.map((m) => (
                  <MatchCard key={m.id} match={m} prediction={predMap.get(m.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
