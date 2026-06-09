"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGroup, deleteGroup } from "./actions";
import type { PrivateGroup } from "@/types/database";

interface Props {
  group: PrivateGroup;
}

export function GroupAdminActions({ group }: Props) {
  const [mode, setMode] = useState<"idle" | "edit" | "delete">("idle");
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateGroup(group.id, name, description);
      if (result.error) {
        setError(result.error);
      } else {
        setMode("idle");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGroup(group.id);
      if (result.error) {
        setError(result.error);
        setMode("idle");
      } else {
        router.push("/mis-grupos");
      }
    });
  }

  if (mode === "edit") {
    return (
      <form onSubmit={handleEdit} className="card space-y-3">
        <p className="font-semibold text-text-primary text-sm">Editar grupo</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
          disabled={isPending}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary bg-bg focus:outline-none focus:border-primary transition-colors"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          maxLength={100}
          disabled={isPending}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary bg-bg focus:outline-none focus:border-primary transition-colors"
        />
        {error && (
          <p className="text-xs text-error bg-error/10 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setMode("idle"); setError(null); setName(group.name); setDescription(group.description); }}
            disabled={isPending}
            className="flex-1 border border-border text-text-secondary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-surface transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || name.trim().length < 3}
            className="flex-1 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    );
  }

  if (mode === "delete") {
    return (
      <div className="card border-error/40 space-y-3">
        <p className="font-semibold text-error text-sm">¿Eliminar el grupo?</p>
        <p className="text-xs text-text-secondary">
          Se eliminarán todos los miembros. Esta acción no se puede deshacer.
        </p>
        {error && (
          <p className="text-xs text-error bg-error/10 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("idle"); setError(null); }}
            disabled={isPending}
            className="flex-1 border border-border text-text-secondary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-surface transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 bg-error text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setMode("edit")}
        className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary border border-border px-3 py-2 rounded-xl hover:text-text-primary hover:border-primary/40 transition-colors"
      >
        ✏️ Editar
      </button>
      <button
        onClick={() => setMode("delete")}
        className="flex items-center gap-1.5 text-xs font-semibold text-error/70 border border-border px-3 py-2 rounded-xl hover:text-error hover:border-error/40 transition-colors"
      >
        🗑️ Eliminar grupo
      </button>
    </div>
  );
}
