import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl mb-4">🥅</p>
      <h2 className="font-syne text-xl font-bold text-secondary mb-2">
        Página no encontrada
      </h2>
      <p className="text-text-secondary mb-6">
        Esta página no existe o fue movida.
      </p>
      <Link href="/partidos" className="btn-primary inline-block">
        Ir a los partidos
      </Link>
    </div>
  );
}
