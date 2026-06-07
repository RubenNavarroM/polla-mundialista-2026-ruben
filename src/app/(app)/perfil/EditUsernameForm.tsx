"use client";

import { useState, useTransition } from "react";
import { updateUsername } from "./actions";

export function EditUsernameForm({ current }: { current: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isValid = /^[a-z0-9_]{3,20}$/.test(value);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateUsername(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-text-primary">@{current}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-primary underline underline-offset-2"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <p className="text-error text-xs">{error}</p>
      )}
      <div className="flex gap-2">
        <input
          name="username"
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          maxLength={20}
          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm font-mono focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending || !isValid || value === current}
          className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg disabled:opacity-50"
        >
          {isPending ? "..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setValue(current); setError(""); }}
          className="px-3 py-1.5 text-text-secondary text-sm rounded-lg hover:bg-surface"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-text-secondary">Solo letras, números y _ (3–20 caracteres)</p>
    </form>
  );
}
