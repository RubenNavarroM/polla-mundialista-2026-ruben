"use client";

import { useTransition } from "react";
import { approveGroup, rejectGroup } from "./actions";
import type { PrivateGroup } from "@/types/database";

interface PendingGroupItem extends PrivateGroup {
  profiles: { username: string };
}

interface Props {
  groups: PendingGroupItem[];
}

export function PendingGroupsAdmin({ groups }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleApprove(groupId: string) {
    startTransition(async () => { await approveGroup(groupId); });
  }

  function handleReject(groupId: string) {
    if (!confirm("¿Rechazar este grupo?")) return;
    startTransition(async () => { await rejectGroup(groupId); });
  }

  return (
    <div className="card border-secondary/40 space-y-3">
      <p className="font-semibold text-secondary text-sm">
        👑 Admin — Grupos pendientes de aprobación ({groups.length})
      </p>
      <div className="space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-bg"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary text-sm truncate">{group.name}</p>
              {group.description && (
                <p className="text-xs text-text-secondary truncate">{group.description}</p>
              )}
              <p className="text-xs text-text-secondary">por {group.profiles.username}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleApprove(group.id)}
                disabled={isPending}
                className="text-xs font-semibold bg-success/10 text-success px-3 py-1.5 rounded-lg hover:bg-success/20 transition-colors disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                onClick={() => handleReject(group.id)}
                disabled={isPending}
                className="text-xs font-semibold bg-error/10 text-error px-3 py-1.5 rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
