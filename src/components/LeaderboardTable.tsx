"use client";

import { useEffect, useState } from "react";
import type { UserScore } from "@/lib/points";

interface Props {
  scores: UserScore[];
  currentUserId: string;
  championMap?: Map<string, string>;
  groupMemberIds?: string[];
}

const medals = ["🥇", "🥈", "🥉"];

function Avatar({ avatarUrl, username }: { avatarUrl: string | null; username: string }) {
  const isEmoji = avatarUrl && !avatarUrl.startsWith("http");
  if (isEmoji) {
    return (
      <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-xl flex-shrink-0">
        {avatarUrl}
      </div>
    );
  }
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={username} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
      <span className="text-white font-bold text-sm">{username.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

export function LeaderboardTable({ scores, currentUserId, championMap, groupMemberIds }: Props) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const groupSet = new Set(groupMemberIds ?? []);

  useEffect(() => {
    setHighlighted(currentUserId);
    const t = setTimeout(() => setHighlighted(null), 2000);
    return () => clearTimeout(t);
  }, [currentUserId]);

  const myEntry = scores.find((s) => s.user_id === currentUserId);
  const myRank = myEntry?.rank ?? null;
  const showStickyMe = myRank !== null && myRank > 10;

  return (
    <div className="space-y-2">
      {scores.slice(0, 50).map((entry) => {
        const isMe = entry.user_id === currentUserId;
        const isTop3 = entry.rank <= 3;

        return (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
              isMe
                ? "border-primary bg-primary/5 shadow-card"
                : isTop3
                ? "border-accent/40 bg-accent/5 shadow-card"
                : "border-border bg-bg"
            } ${highlighted === entry.user_id ? "scale-[1.01]" : ""}`}
          >
            {/* Posición */}
            <div className="w-8 text-center flex-shrink-0">
              {isTop3 ? (
                <span className="text-xl">{medals[entry.rank - 1]}</span>
              ) : (
                <span className="font-syne font-bold text-text-secondary text-sm">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar avatarUrl={entry.avatar_url} username={entry.username} />

            {/* Nombre + campeón */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate text-sm ${isMe ? "text-primary" : "text-text-primary"}`}>
                {entry.username}
                {isMe && <span className="text-xs font-normal text-text-secondary ml-1">(tú)</span>}
                {!isMe && groupSet.has(entry.user_id) && (
                  <span className="ml-1.5 text-xs text-success font-normal">👥</span>
                )}
              </p>
              {championMap?.get(entry.user_id) && (
                <p className="text-xs text-text-secondary truncate">
                  🏆 {championMap.get(entry.user_id)}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-shrink-0 text-right">
              <div className="hidden sm:block text-center">
                <p className="text-xs text-text-secondary">Exactos</p>
                <p className="font-bold text-sm text-success">{entry.exact_scores}</p>
              </div>
              <div className="hidden sm:block text-center">
                <p className="text-xs text-text-secondary">Correctos</p>
                <p className="font-bold text-sm text-secondary">{entry.correct_results}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-secondary">Puntos</p>
                <p className={`font-syne font-bold text-lg ${isTop3 ? "text-primary" : "text-text-primary"}`}>
                  {entry.total_points}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Sticky: mi posición si estoy fuera del top 10 */}
      {showStickyMe && myEntry && (
        <div className="sticky bottom-4 mt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-primary bg-bg shadow-card-hover">
            <div className="w-8 text-center font-syne font-bold text-primary text-sm flex-shrink-0">
              {myEntry.rank}
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {myEntry.username.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary text-sm truncate">
                {myEntry.username} <span className="text-xs text-text-secondary font-normal">(tú)</span>
              </p>
            </div>
            <div className="font-syne font-bold text-lg text-primary">
              {myEntry.total_points} pts
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
