import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "./CreateGroupForm";
import { JoinGroupForm } from "./JoinGroupForm";
import { PendingGroupsAdmin } from "./PendingGroupsAdmin";
import type { PrivateGroup, GroupMember } from "@/types/database";

interface MembershipWithGroup extends GroupMember {
  private_groups: PrivateGroup;
}

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

  const { data: rawMemberships } = await supabase
    .from("group_members")
    .select("*, private_groups(*)")
    .eq("user_id", user.id)
    .neq("status", "rejected")
    .order("joined_at", { ascending: false });

  const memberships = (rawMemberships ?? []) as unknown as MembershipWithGroup[];
  const myGroups = memberships.filter((m) => m.private_groups != null);
  const activeCount = myGroups.length;

  let pendingGroups: PendingGroupWithProfile[] = [];
  if (isAppAdmin) {
    const { data } = await supabase
      .from("private_groups")
      .select("*, profiles!created_by(username)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    pendingGroups = (data ?? []) as unknown as PendingGroupWithProfile[];
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-syne text-2xl font-bold text-secondary">Mis Grupos 👥</h1>
        <p className="text-text-secondary text-sm mt-1">
          Compite con tus amigos en grupos privados
        </p>
      </div>

      {/* App admin: pending groups */}
      {isAppAdmin && pendingGroups.length > 0 && (
        <PendingGroupsAdmin groups={pendingGroups} />
      )}

      {/* My groups list */}
      {myGroups.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold text-text-primary">Aún no perteneces a ningún grupo</p>
          <p className="text-text-secondary text-sm mt-1">Crea uno o únete con un código de invitación</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myGroups.map((m) => {
            const group = m.private_groups;
            const isActive = group.status === "active";
            return (
              <div key={group.id} className="relative">
                {isActive ? (
                  <Link
                    href={`/mis-grupos/${group.id}`}
                    className="card flex items-center gap-3 hover:border-primary/40 transition-colors"
                  >
                    <GroupCard group={group} role={m.role} />
                  </Link>
                ) : (
                  <div className="card flex items-center gap-3 opacity-70">
                    <GroupCard group={group} role={m.role} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
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
