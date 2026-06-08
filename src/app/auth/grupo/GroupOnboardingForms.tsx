"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroup, joinGroup } from "@/app/(app)/mis-grupos/actions";

type Tab = "join" | "create";

export function GroupOnboardingForms() {
  const [tab, setTab] = useState<Tab>("join");
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setTab("join")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            tab === "join"
              ? "bg-secondary text-white"
              : "bg-bg text-text-secondary hover:text-text-primary"
          }`}
        >
          🔑 Unirme a un grupo
        </button>
        <button
          onClick={() => setTab("create")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            tab === "create"
              ? "bg-secondary text-white"
              : "bg-bg text-text-secondary hover:text-text-primary"
          }`}
        >
          ➕ Crear mi grupo
        </button>
      </div>

      {tab === "join" ? (
        <JoinForm onSuccess={() => router.push("/partidos")} />
      ) : (
        <CreateForm onSuccess={() => router.push("/partidos")} />
      )}
    </div>
  );
}

function JoinForm({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinGroup(code);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-text-secondary">
        Pídele a alguien el código de su grupo e ingrésalo aquí.
      </p>
      <input
        type="text"
        placeholder="Código de invitación"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={8}
        required
        disabled={isPending}
        className="w-full border border-border rounded-xl px-4 py-3 text-base font-mono tracking-widest text-center text-text-primary bg-bg focus:outline-none focus:border-primary transition-colors uppercase"
      />
      {error && (
        <p className="text-sm text-error bg-error/10 rounded-xl px-4 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={isPending || code.length < 4}
        className="w-full bg-secondary text-white font-semibold px-4 py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Buscando..." : "Unirme al grupo"}
      </button>
      <p className="text-xs text-text-secondary text-center">
        El admin del grupo deberá aprobar tu solicitud
      </p>
    </form>
  );
}

function CreateForm({ onSuccess }: { onSuccess: () => void }) {
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
        onSuccess();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-text-secondary">
        Crea tu propio grupo e invita a tus amigos con el código.
      </p>
      <input
        type="text"
        placeholder="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        required
        disabled={isPending}
        className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-primary bg-bg focus:outline-none focus:border-primary transition-colors"
      />
      <input
        type="text"
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={100}
        disabled={isPending}
        className="w-full border border-border rounded-xl px-4 py-3 text-sm text-text-primary bg-bg focus:outline-none focus:border-primary transition-colors"
      />
      {error && (
        <p className="text-sm text-error bg-error/10 rounded-xl px-4 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={isPending || name.trim().length < 3}
        className="w-full bg-primary text-white font-semibold px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Creando..." : "Crear grupo"}
      </button>
      <p className="text-xs text-text-secondary text-center">
        El grupo requiere aprobación del administrador antes de activarse
      </p>
    </form>
  );
}
