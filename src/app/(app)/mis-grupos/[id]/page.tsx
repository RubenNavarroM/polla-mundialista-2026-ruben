import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatches } from "@/lib/api-football";
import { calcLeaderboard } from "@/lib/points";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { GroupMembersPanel } from "../GroupMembersPanel";
import type { PrivateGroup, GroupMemberWithProfile } from "@/types/database";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: rawGroup } = await supabase
    .from("private_groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!rawGroup || rawGroup.status !== "active") notFound();
  const group = rawGroup as unknown as PrivateGroup;

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  if (!myMembership) redirect("/mis-grupos");

  const isGroupAdmin = myMembership.role === "admin";

  const { data: rawMembers } = await supabase
    .from("group_members")
    .select("*, profiles(*)")
    .eq("group_id", id)
    .order("joined_at", { ascending: true });

  const allMembers = (rawMembers ?? []) as unknown as GroupMemberWithProfile[];
  const approvedMembers = allMembers.filter((m) => m.status === "approved");
  const pendingMembers = allMembers.filter((m) => m.status === "pending");

  const memberUserIds = approvedMembers.map((m) => m.user_id);

  const [{ data: profiles }, { data: predictions }, { data: brackets }, matches] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").in("id", memberUserIds),
    supabase.from("predictions").select("*").in("user_id", memberUserIds),
    supabase.from("bracket_predictions").select("*").in("user_id", memberUserIds),
    getMatches(),
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

  const championMap = new Map((brackets ?? []).map((b) => [b.user_id, b.champion_team ?? ""]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-text-secondary mb-1">
            <a href="/mis-grupos" className="hover:text-primary transition-colors">← Mis grupos</a>
          </p>
          <h1 className="font-syne text-2xl font-bold text-secondary">{group.name}</h1>
          {group.description && (
            <p className="text-text-secondary text-sm mt-1">{group.description}</p>
          )}
        </div>
        {isGroupAdmin && (
          <div className="card py-2 px-3 flex-shrink-0 text-center">
            <p className="text-xs text-text-secondary mb-0.5">Código de invitación</p>
            <p className="font-mono font-bold text-secondary text-lg tracking-widest">{group.invite_code}</p>
          </div>
        )}
      </div>

      {/* Group admin management panel */}
      {isGroupAdmin && (
        <GroupMembersPanel
          pendingMembers={pendingMembers}
          approvedMembers={approvedMembers}
        />
      )}

      {/* Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-syne text-lg font-bold text-secondary">
            Ranking del grupo
          </h2>
          <span className="text-sm text-text-secondary">{approvedMembers.length} jugadores</span>
        </div>

        <div className="flex items-center gap-3 px-4 mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
          <div className="w-8 text-center">#</div>
          <div className="w-9" />
          <div className="flex-1">Jugador</div>
          <div className="hidden sm:block w-16 text-center">Exactos</div>
          <div className="hidden sm:block w-16 text-center">Correct.</div>
          <div className="w-14 text-center">Pts</div>
        </div>

        {scores.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-2xl mb-2">⏳</p>
            <p className="text-text-secondary text-sm">Aún no hay puntos en este grupo</p>
          </div>
        ) : (
          <LeaderboardTable scores={scores} currentUserId={user.id} championMap={championMap} />
        )}
      </div>
    </div>
  );
}
