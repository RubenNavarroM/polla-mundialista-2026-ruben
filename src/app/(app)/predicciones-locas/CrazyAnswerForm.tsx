"use client";

import { useState, useTransition } from "react";
import { submitCrazyAnswer } from "./actions";

interface Props {
  jornadaId: string;
  currentValue?: number | null;
  question: string;
  emoji: string;
}

export function CrazyAnswerForm({ jornadaId, currentValue, question, emoji }: Props) {
  const [value, setValue] = useState(currentValue?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      setError("Ingresa un número válido (0 o más)");
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await submitCrazyAnswer(jornadaId, num);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {emoji} Tu predicción
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSuccess(false);
            }}
            placeholder="0"
            className="flex-1 border-2 border-border rounded-xl px-4 py-3 text-2xl font-bold text-center text-text-primary focus:outline-none focus:border-primary transition-colors tabular-nums"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || value === ""}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {isPending ? "Guardando..." : currentValue != null ? "Actualizar" : "Predecir"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-error bg-error/10 rounded-xl px-4 py-2">{error}</p>
      )}

      {success && (
        <p className="text-sm text-success bg-success/10 rounded-xl px-4 py-2">
          ✓ Predicción guardada. ¡Suerte!
        </p>
      )}

      <p className="text-xs text-text-secondary text-center">{question}</p>
    </form>
  );
}
