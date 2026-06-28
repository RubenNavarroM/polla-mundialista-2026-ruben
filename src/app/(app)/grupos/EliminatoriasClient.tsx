"use client";

import { useState } from "react";
import type { Match } from "@/types/api";

const TABS = [
  { key: "round_of_32",   label: "1/16",        title: "16avos de Final"  },
  { key: "round_of_16",   label: "1/8",         title: "Octavos de Final" },
  { key: "quarter_final", label: "1/4",         title: "Cuartos de Final" },
  { key: "semi_final",    label: "Semifinales", title: "Semifinales"      },
  { key: "final",         label: "Final",       title: "Gran Final"       },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

interface TeamRowProps {
  name: string;
  flag: string;
  score: number | null;
  winner: boolean | null; // true=won, false=lost, null=not played
}

function TeamRow({ name, flag, score, winner }: TeamRowProps) {
  const tbd = name === "Por definir";
  return (
    <div className={`flex items-center gap-2.5 ${winner === false ? "opacity-35" : ""}`}>
      {flag && !tbd ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flag}
          alt={name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 border-2 border-border"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-xs text-text-secondary flex-shrink-0">
          ?
        </div>
      )}
      <span
        className={`text-sm font-semibold flex-1 truncate ${
          winner ? "text-secondary" : "text-text-primary"
        } ${tbd ? "italic text-text-secondary font-normal" : ""}`}
      >
        {tbd ? "Por definir" : name}
      </span>
      {score !== null && (
        <span
          className={`text-base font-bold tabular-nums min-w-[1.25rem] text-right ${
            winner ? "text-secondary" : "text-text-primary"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const done = match.status === "finished";
  const live = match.status === "live";
  const hs = match.home_score;
  const as_ = match.away_score;
  const homeWon: boolean | null = done && hs !== null && as_ !== null ? hs > as_ : null;
  const awayWon: boolean | null = done && hs !== null && as_ !== null ? as_ > hs : null;

  return (
    <div
      className={`rounded-2xl border overflow-hidden bg-surface ${
        live ? "border-error" : "border-border"
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Live badge */}
      {live && (
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
          <span className="text-xs font-bold text-error tracking-widest">EN VIVO</span>
        </div>
      )}

      {/* Date row (upcoming only) */}
      {!done && !live && (
        <div className="flex justify-between items-center px-3 pt-2.5 pb-0.5">
          <span className="text-[11px] font-medium text-text-secondary">{fmtDate(match.date)}</span>
          <span className="text-[11px] font-semibold text-text-secondary">{fmtTime(match.date)}</span>
        </div>
      )}

      <div className="px-3 pb-3 pt-2.5 space-y-2.5">
        <TeamRow
          name={match.home_team.name}
          flag={match.home_team.flag}
          score={done || live ? hs : null}
          winner={homeWon}
        />
        <div className="border-t border-border/50" />
        <TeamRow
          name={match.away_team.name}
          flag={match.away_team.flag}
          score={done || live ? as_ : null}
          winner={awayWon}
        />
      </div>
    </div>
  );
}

function BracketPair({ pair }: { pair: Match[] }) {
  const single = pair.length === 1;

  if (single) return <MatchCard match={pair[0]} />;

  return (
    <div className="flex items-stretch gap-0">
      {/* Two match cards */}
      <div className="flex-1 flex flex-col gap-1.5">
        <MatchCard match={pair[0]} />
        <MatchCard match={pair[1]} />
      </div>

      {/* Bracket connector */}
      <div className="w-4 flex-shrink-0 flex flex-col">
        <div className="flex-1 border-r-2 border-t-2 border-border/70 rounded-tr-xl" />
        <div className="flex-1 border-r-2 border-b-2 border-border/70 rounded-br-xl" />
      </div>
    </div>
  );
}

export interface MatchesByStage {
  round_of_32?: Match[];
  round_of_16?: Match[];
  quarter_final?: Match[];
  semi_final?: Match[];
  third_place?: Match[];
  final?: Match[];
}

export function EliminatoriasClient({ matchesByStage }: { matchesByStage: MatchesByStage }) {
  const available = TABS.filter(
    (t) => (matchesByStage[t.key as keyof MatchesByStage]?.length ?? 0) > 0
  );

  const [activeKey, setActiveKey] = useState<TabKey>(available[0]?.key ?? "final");

  const activeTab = TABS.find((t) => t.key === activeKey)!;

  // For the final tab, also include third_place matches
  const currentMatches =
    activeKey === "final"
      ? [...(matchesByStage.final ?? [])]
      : (matchesByStage[activeKey as keyof MatchesByStage] ?? []);

  const thirdPlaceMatches =
    activeKey === "final" ? (matchesByStage.third_place ?? []) : [];

  // Group current matches in pairs for bracket visual
  const pairs: Match[][] = [];
  for (let i = 0; i < currentMatches.length; i += 2) {
    pairs.push(currentMatches.slice(i, i + 2));
  }

  return (
    <div>
      {/* ── Tab nav ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {available.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveKey(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
              activeKey === t.key
                ? "bg-secondary text-white border-secondary shadow-md"
                : "bg-surface text-text-secondary border-border hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Round title ── */}
      <h2 className="font-syne text-lg font-bold text-text-primary mb-4">
        {activeTab.title}
      </h2>

      {/* ── Matches ── */}
      {activeKey === "final" ? (
        /* Final tab: Tercer puesto + Final as separate labeled sections */
        <div className="space-y-6">
          {thirdPlaceMatches.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest px-1">
                Tercer Puesto 🥉
              </p>
              {thirdPlaceMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
          {currentMatches.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest px-1">
                Gran Final 🏆
              </p>
              {currentMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* All other tabs: paired matches with bracket connectors */
        <div className="space-y-5">
          {pairs.map((pair, i) => (
            <BracketPair key={i} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
}
