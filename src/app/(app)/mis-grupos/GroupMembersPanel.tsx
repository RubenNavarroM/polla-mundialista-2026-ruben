"use client";

import { useTransition } from "react";
import { approveMember, rejectMember, removeMember } from "./actions";
import type { GroupMemberWithProfile } from "@/types/database";

interface Props {
  pendingMembers: GroupMemberWithProfile[];
  approvedMembers: GroupMemberWithProfile[];
}

export function GroupMembersPanel({ pendingMembers, approvedMembers }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleApprove(memberId: string) {
    startTransition(async () => { await approveMember(memberId); });
  }

  function handleReject(memberId: string) {
    if (!confirm("¿Rechazar a este usuario?")) return;
    startTransition(async () => { await rejectMember(memberId); });
  }

  function handleRemove(memberId: string, username: string) {
    if (!confirm(`¿Expulsar a ${username} del grupo?`)) return;
    startTransition(async () => { await removeMember(memberId); });
  }

  return (
    <div className="space-y-4">
      {/* Pending members */}
      {pendingMembers.length > 0 && (
        <div className="card border-secondary/40 space-y-3">
          <p className="font-semibold text-secondary text-sm">
            Solicitudes pendientes ({pendingMembers.length})
          </p>
          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-bg"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {member.profiles.username.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <p className="flex-1 font-semibold text-text-primary text-sm truncate">
                  {member.profiles.username}
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(member.id)}
                    disabled={isPending}
                    className="text-xs font-semibold bg-success/10 text-success px-3 py-1.5 rounded-lg hover:bg-success/20 transition-colors disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReject(member.id)}
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
      )}

      {/* Approved members management */}
      <div className="card space-y-3">
        <p className="font-semibold text-text-primary text-sm">
          Miembros ({approvedMembers.length})
        </p>
        <div className="space-y-2">
          {approvedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-bg"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {member.profiles.username.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm truncate">
                  {member.profiles.username}
                </p>
                {member.role === "admin" && (
                  <p className="text-xs text-secondary">Admin del grupo</p>
                )}
              </div>
              {member.role !== "admin" && (
                <button
                  onClick={() => handleRemove(member.id, member.profiles.username)}
                  disabled={isPending}
                  className="text-xs font-semibold text-text-secondary hover:text-error transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  Expulsar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
