"use client";

import { useState } from "react";
import { signIn, signUp } from "./actions";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = mode === "login" ? await signIn(formData) : await signUp(formData);

    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Campo de fútbol decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute bottom-0 left-0 right-0 w-full opacity-[0.04]"
          viewBox="0 0 800 400"
          fill="none"
        >
          <rect x="0" y="0" width="800" height="400" fill="#002868" />
          <rect x="40" y="40" width="720" height="320" stroke="#fff" strokeWidth="4" fill="none" />
          <circle cx="400" cy="200" r="60" stroke="#fff" strokeWidth="4" fill="none" />
          <line x1="400" y1="40" x2="400" y2="360" stroke="#fff" strokeWidth="4" />
          <rect x="40" y="140" width="100" height="120" stroke="#fff" strokeWidth="4" fill="none" />
          <rect x="660" y="140" width="100" height="120" stroke="#fff" strokeWidth="4" fill="none" />
          <circle cx="400" cy="200" r="4" fill="#fff" />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="font-syne text-3xl font-bold text-secondary">
            Polla Mundialista
          </h1>
          <p className="font-syne text-lg font-semibold text-primary mt-1">
            FIFA World Cup 2026
          </p>
          <p className="text-text-secondary text-sm mt-2">
            USA 🇺🇸 · Canada 🇨🇦 · Mexico 🇲🇽
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="card space-y-4">
            {/* Tabs */}
            <div className="flex bg-surface rounded-xl p-1 gap-1">
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-bg text-secondary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setMode("register"); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  mode === "register"
                    ? "bg-bg text-secondary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Registrarse
              </button>
            </div>

            {error && (
              <div className="bg-error/10 text-error text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="email"
                type="email"
                required
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Contraseña (mín. 6 caracteres)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Cargando..."
                  : mode === "login"
                  ? "Entrar 🚀"
                  : "Crear cuenta 🎉"}
              </button>
            </form>
          </div>

          <p className="text-center text-text-secondary text-xs mt-6">
            Al entrar aceptas jugar limpio 🤝
          </p>
        </div>
      </div>
    </div>
  );
}
