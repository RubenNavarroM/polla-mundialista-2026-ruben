import Link from "next/link";
import type { UserScore } from "@/lib/points";

interface Props {
  groupId: string;
  groupName: string;
  scores: UserScore[];
  currentUserId: string;
}

const medals = ["🥇", "🥈", "🥉"];

export function GroupMiniRanking({ groupId, groupName, scores, currentUserId }: Props) {
  const top3 = scores.slice(0, 3);
  const myEntry = scores.find((s) => s.user_id === currentUserId);
  const myRank = myEntry?.rank ?? null;
  const showMyRow = myRank !== null && myRank > 3;

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
          👥 {groupName}
        </p>
        <Link
          href={`/mis-grupos/${groupId}`}
          className="text-xs text-text-secondary hover:text-primary transition-colors"
        >
          Ver completo →
        </Link>
      </div>

      {scores.length === 0 ? (
        <p className="text-xs text-text-secondary text-center py-2">Aún no hay puntos</p>
      ) : (
        <div className="space-y-1">
          {top3.map((entry) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl ${isMe ? "bg-primary/5" : ""}`}
              >
                <span className="text-base w-6 text-center flex-shrink-0">
                  {entry.rank <= 3 ? medals[entry.rank - 1] : entry.rank}
                </span>
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {entry.username.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className={`flex-1 text-xs font-semibold truncate ${isMe ? "text-primary" : "text-text-primary"}`}>
                  {entry.username}{isMe && " (tú)"}
                </span>
                <span className="font-syne font-bold text-sm text-text-primary flex-shrink-0">
                  {entry.total_points}
                </span>
              </div>
            );
          })}

          {showMyRow && myEntry && (
            <>
              <div className="border-t border-dashed border-border my-1" />
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-primary/5">
                <span className="text-xs font-bold text-primary w-6 text-center flex-shrink-0">
                  {myRank}
                </span>
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {myEntry.username.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className="flex-1 text-xs font-semibold text-primary truncate">
                  {myEntry.username} (tú)
                </span>
                <span className="font-syne font-bold text-sm text-primary flex-shrink-0">
                  {myEntry.total_points}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
