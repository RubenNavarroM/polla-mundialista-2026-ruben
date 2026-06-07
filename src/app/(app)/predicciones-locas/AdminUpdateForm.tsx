"use client";

import { useState, useTransition } from "react";
import { updateJornadaResult } from "./actions";

interface Props {
  jornadaId: string;
  currentRealValue: number | null;
  statKey: string;
}

export function AdminUpdateForm({ jornadaId, currentRealValue, statKey }: Props) {
  const [value, setValue] = useState(currentRealValue?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      setError("Ingresa un número válido");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateJornadaResult(jornadaId, num);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <div className="border border-accent/40 bg-accent/5 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        🔧 Admin — Actualizar resultado real
      </p>
      <p className="text-xs text-text-secondary font-mono">stat: {statKey}</p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSuccess(false);
          }}
          placeholder="Valor real"
          className="flex-1 border-2 border-border rounded-xl px-4 py-2 text-lg font-bold text-center focus:outline-none focus:border-accent transition-colors"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || value === ""}
          className="bg-accent text-secondary font-bold px-5 py-2 rounded-xl hover:bg-accent/90 transition disabled:opacity-50"
        >
          {isPending ? "..." : "Guardar"}
        </button>
      </form>
      {error && <p className="text-xs text-error">{error}</p>}
      {success && <p className="text-xs text-success">✓ Resultado guardado y puntos calculados</p>}
    </div>
  );
}
