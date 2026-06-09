import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "./CreateGroupForm";
import { JoinGroupForm } from "./JoinGroupForm";
import { PendingGroupsAdmin } from "./PendingGroupsAdmin";
import type { PrivateGroup, GroupMember } from "@/types/database";

interface PendingGroupWithProfile extends PrivateGroup {
  profiles: { username: string };
}

const statusBadge: Record<string, string> = {
  pending: "Pendiente de aprobación",
  active: "Activo",
  rejected: "Rechazado",
};

const statusStyle: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  active: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
};

export default async function MisGruposPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const isAppAdmin = user.email === process.env.ADMIN_EMAIL;

  // Query 1: membresías del usuario
  const { data: rawMemberships } = await supabase
    .from("group_members")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "rejected")
    .order("joined_at", { ascending: false });

  const memberships = (rawMemberships ?? []) as GroupMember[];

  // Query 2: grupos correspondientes
  const groupIds = memberships.map((m) => m.group_id);
  const groupsMap = new Map<string, PrivateGroup>();
  if (groupIds.length > 0) {
    const { data: rawGroups } = await supabase
      .from("private_groups")
      .select("*")
      .in("id", groupIds);
    for (const g of (rawGroups ?? []) as unknown as PrivateGroup[]) {
      groupsMap.set(g.id, g);
    }
  }

  const myGroups = memberships
    .map((m) => ({ membership: m, group: groupsMap.get(m.group_id) }))
    .filter((item): item is { membership: GroupMember; group: PrivateGroup } => item.group != null);

  const activeCount = myGroups.length;

  // Grupos pendientes de aprobación (solo para app admin)
  let pendingGroups: PendingGroupWithProfile[] = [];
  if (isAppAdmin) {
    const { data: rawPending } = await supabase
      .from("private_groups")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (rawPending && rawPending.length > 0) {
      const creatorIds = rawPending.map((g) => g.created_by);
      const { data: creators } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", creatorIds);
      const creatorMap = new Map((creators ?? []).map((p) => [p.id, p.username]));
      pendingGroups = (rawPending as unknown as PrivateGroup[]).map((g) => ({
        ...g,
        profiles: { username: creatorMap.get(g.created_by) ?? "Usuario" },
      }));
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Mis Grupos 👥</h1>
        <p className="text-text-secondary text-sm mt-1">
          Compite con tus amigos en grupos privados
        </p>
      </div>

      {/* App admin: grupos pendientes de aprobación */}
      {isAppAdmin && pendingGroups.length > 0 && (
        <PendingGroupsAdmin groups={pendingGroups} />
      )}

      {/* Lista de mis grupos */}
      {myGroups.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold text-text-primary">Aún no perteneces a ningún grupo</p>
          <p className="text-text-secondary text-sm mt-1">Crea uno o únete con un código de invitación</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myGroups.map(({ membership, group }) => {
            const isActive = group.status === "active";
            return (
              <div key={group.id}>
                {isActive ? (
                  <Link
                    href={`/mis-grupos/${group.id}`}
                    className="card flex items-center gap-3 hover:border-primary/40 transition-colors"
                  >
                    <GroupCard group={group} role={membership.role} />
                  </Link>
                ) : (
                  <div className="card flex items-center gap-3 opacity-70">
                    <GroupCard group={group} role={membership.role} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CreateGroupForm disabled={activeCount >= 3} />
        <JoinGroupForm disabled={activeCount >= 3} />
      </div>

      <p className="text-xs text-text-secondary text-center">
        Máximo 3 grupos por jugador · Los grupos nuevos requieren aprobación
      </p>
    </div>
  );
}

function GroupCard({ group, role }: { group: PrivateGroup; role: string }) {
  return (
    <>
      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 text-xl">
        👥
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary truncate">{group.name}</p>
        {group.description && (
          <p className="text-xs text-text-secondary truncate">{group.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[group.status]}`}>
            {statusBadge[group.status]}
          </span>
          {role === "admin" && (
            <span className="text-xs font-semibold text-secondary">Admin</span>
          )}
        </div>
      </div>
      {group.status === "active" && (
        <span className="text-text-secondary text-sm flex-shrink-0">→</span>
      )}
    </>
  );
}
