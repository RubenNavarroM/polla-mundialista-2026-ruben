import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMatches } from "@/lib/api-football";
import { calcLeaderboard } from "@/lib/points";
import { GroupMiniRanking } from "@/components/GroupMiniRanking";
import { AutoRefresh } from "@/components/AutoRefresh";
import type { UserScore } from "@/lib/points";

export const revalidate = 60;

interface GroupRanking {
  groupId: string;
  groupName: string;
  scores: UserScore[];
}

async function getLeaderboardData() {
  const supabase = await createClient();

  const [
    { data: profiles },
    { data: predictions },
    { data: brackets },
    matches,
    { data: { user } },
  ] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url"),
    supabase.from("predictions").select("*"),
    supabase.from("bracket_predictions").select("*"),
    getMatches(),
    supabase.auth.getUser(),
  ]);

  const finishedMatches = matches.filter((m) => m.status === "finished");

  const final = finishedMatches.find((m) => m.stage === "final");
  let champion: string | null = null;
  let runnerUp: string | null = null;
  if (final && final.home_score !== null && final.away_score !== null) {
    if (final.home_score > final.away_score) {
      champion = final.home_team.name;
      runnerUp = final.away_team.name;
    } else {
      champion = final.away_team.name;
      runnerUp = final.home_team.name;
    }
  }

  const scores = calcLeaderboard(
    profiles ?? [],
    predictions ?? [],
    finishedMatches,
    brackets ?? [],
    champion,
    runnerUp
  );

  const userId = user?.id ?? "";
  let groupRankings: GroupRanking[] = [];

  if (userId) {
    const { data: myMemberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "approved");

    const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

    if (myGroupIds.length > 0) {
      const [{ data: groupsData }, { data: allMembersData }] = await Promise.all([
        supabase
          .from("private_groups")
          .select("id, name")
          .in("id", myGroupIds)
          .eq("status", "active"),
        supabase
          .from("group_members")
          .select("group_id, user_id")
          .in("group_id", myGroupIds)
          .eq("status", "approved"),
      ]);

      const groupMembersMap = new Map<string, Set<string>>();
      for (const m of allMembersData ?? []) {
        if (!groupMembersMap.has(m.group_id)) groupMembersMap.set(m.group_id, new Set());
        groupMembersMap.get(m.group_id)!.add(m.user_id);
      }

      groupRankings = (groupsData ?? []).map((group) => {
        const memberIds = groupMembersMap.get(group.id) ?? new Set<string>();
        const groupScores = scores
          .filter((s) => memberIds.has(s.user_id))
          .map((s, idx) => ({ ...s, rank: idx + 1 }));
        return { groupId: group.id, groupName: group.name, scores: groupScores };
      });
    }
  }

  return { currentUserId: userId, groupRankings };
}

export default async function LeaderboardPage() {
  const { currentUserId, groupRankings } = await getLeaderboardData();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <AutoRefresh intervalMs={60000} />

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-syne text-2xl font-bold text-secondary">Ranking 🏆</h1>
          <p className="text-text-secondary text-sm mt-1">
            Se actualiza cada 60 segundos · Exacto 5 pts · Correcto 2 pts
          </p>
        </div>
        <Link
          href="/reglas"
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-surface border border-border px-3 py-2 rounded-xl hover:text-text-primary hover:border-primary/40 transition-colors"
        >
          📋 Reglas
        </Link>
      </div>

      {groupRankings.length > 0 ? (
        <div className={`grid gap-3 ${groupRankings.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
          {groupRankings.map((gr) => (
            <GroupMiniRanking
              key={gr.groupId}
              groupId={gr.groupId}
              groupName={gr.groupName}
              scores={gr.scores}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold text-text-primary">No perteneces a ningún grupo</p>
          <p className="text-text-secondary text-sm mt-1">Únete o crea un grupo para ver el ranking</p>
          <Link
            href="/mis-grupos"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary border border-primary/40 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"
          >
            Ver grupos
          </Link>
        </div>
      )}
    </div>
  );
}
