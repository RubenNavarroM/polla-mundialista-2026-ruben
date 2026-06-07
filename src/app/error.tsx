"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl mb-4">⚽</p>
      <h2 className="font-syne text-xl font-bold text-secondary mb-2">
        Algo salió mal
      </h2>
      <p className="text-text-secondary mb-6 max-w-xs">
        Hubo un problema cargando esta página. Intenta de nuevo.
      </p>
      <button onClick={reset} className="btn-primary">
        Volver a intentar
      </button>
    </div>
  );
}
