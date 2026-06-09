"use client";

import { useState, useTransition } from "react";
import { joinGroup } from "./actions";

interface Props {
  disabled: boolean;
}

export function JoinGroupForm({ disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await joinGroup(code);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setCode("");
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
        <span className="text-2xl">🔑</span>
        <span>Unirse con código</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <p className="font-semibold text-text-primary text-sm">Unirse a un grupo</p>

      <input
        type="text"
        placeholder="Código de invitación"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={8}
        required
        disabled={isPending}
        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest text-center text-text-primary bg-bg focus:outline-none focus:border-primary transition-colors uppercase"
      />

      {error && (
        <p className="text-xs text-error bg-error/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-xs text-success bg-success/10 rounded-lg px-3 py-2">
          ✓ Solicitud enviada. El admin del grupo debe aprobarte.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); setSuccess(false); }}
          disabled={isPending}
          className="flex-1 border border-border text-text-secondary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-surface transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || code.length < 4}
          className="flex-1 bg-secondary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Buscando..." : "Unirme"}
        </button>
      </div>
    </form>
  );
}
