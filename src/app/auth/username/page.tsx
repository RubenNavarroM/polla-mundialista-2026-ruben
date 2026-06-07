"use client";

import { useState } from "react";
import { setupUsername } from "../actions";

export default function UsernamePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [value, setValue] = useState("");

  const isValid = /^[a-z0-9_]{3,20}$/.test(value);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await setupUsername(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="font-syne text-2xl font-bold text-secondary">
            ¡Elige tu nombre!
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Así te verán en el leaderboard 🏆
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-error/10 text-error text-sm px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                name="username"
                type="text"
                required
                value={value}
                onChange={(e) => setValue(e.target.value.toLowerCase())}
                placeholder="ej: cracks_jamar"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition font-mono"
              />
              <div className="flex justify-between mt-1.5 px-1">
                <p className="text-text-secondary text-xs">
                  Solo letras, números y _ (3–20 caracteres)
                </p>
                <p className={`text-xs font-mono ${value.length > 20 ? "text-error" : "text-text-secondary"}`}>
                  {value.length}/20
                </p>
              </div>
            </div>

            {value.length >= 3 && (
              <div className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${isValid ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                {isValid ? "✓ Nombre válido" : "✗ Solo usa letras, números y guión bajo"}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValid}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Entrar a la polla 🚀"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
