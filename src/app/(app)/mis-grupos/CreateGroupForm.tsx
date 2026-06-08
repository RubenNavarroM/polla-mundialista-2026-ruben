"use client";

import { useState, useTransition } from "react";
import { createGroup } from "./actions";

interface Props {
  disabled: boolean;
}

export function CreateGroupForm({ disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createGroup(name, description);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setName("");
        setDescription("");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="card flex items-center justify-center gap-2 py-5 font-semibold text-text-primary hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        <span className="text-2xl">➕</span>
        <span>Crear grupo</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <p className="font-semibold text-text-primary text-sm">Nuevo grupo</p>

      <input
        type="text"
        placeholder="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        required
        disabled={isPending}
        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary bg-bg focus:outline-none focus:border-primary transition-colors"
      />

      <input
        type="text"
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
          onClick={() => { setOpen(false); setError(null); }}
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
          {isPending ? "Creando..." : "Crear"}
        </button>
      </div>

      <p className="text-xs text-text-secondary text-center">
        El grupo requiere aprobación antes de activarse
      </p>
    </form>
  );
}
