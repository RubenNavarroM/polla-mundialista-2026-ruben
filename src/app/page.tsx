import Link from "next/link";
import { CountdownTimer } from "@/components/CountdownTimer";

const FIRST_MATCH = "2026-06-11T19:00:00Z";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
      {/* Campo de fútbol decorativo */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <svg className="absolute bottom-0 w-full opacity-[0.035]" viewBox="0 0 800 400" fill="none">
          <rect width="800" height="400" fill="#002868" />
          <rect x="40" y="40" width="720" height="320" stroke="#fff" strokeWidth="4" fill="none" />
          <circle cx="400" cy="200" r="60" stroke="#fff" strokeWidth="4" fill="none" />
          <line x1="400" y1="40" x2="400" y2="360" stroke="#fff" strokeWidth="4" />
          <rect x="40" y="140" width="100" height="120" stroke="#fff" strokeWidth="4" fill="none" />
          <rect x="660" y="140" width="100" height="120" stroke="#fff" strokeWidth="4" fill="none" />
          <circle cx="400" cy="200" r="4" fill="#fff" />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: "2s" }}>⚽</div>
            <h1 className="font-syne text-4xl font-bold text-secondary leading-tight">
              Polla<br />Mundialista
            </h1>
            <p className="font-syne text-lg font-semibold text-primary mt-1">
              FIFA World Cup 2026
            </p>
            <p className="text-text-secondary text-sm mt-2">
              🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico
            </p>
          </div>

          {/* Countdown */}
          <CountdownTimer
            targetDate={FIRST_MATCH}
            label="Para el primer partido · México vs Sudáfrica"
          />

          {/* Puntos */}
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { pts: "5 pts", label: "Marcador exacto 🎯" },
              { pts: "2 pts", label: "Resultado correcto ✓" },
              { pts: "10 pts", label: "Campeón 🏆" },
              { pts: "5 pts", label: "Subcampeón 🥈" },
            ].map(({ pts, label }) => (
              <div key={label} className="bg-surface rounded-xl px-3 py-2">
                <p className="font-syne font-bold text-primary text-sm">{pts}</p>
                <p className="text-text-secondary text-xs">{label}</p>
              </div>
            ))}
          </div>

          <Link href="/auth" className="btn-primary block text-center text-lg py-4">
            Entrar a jugar 🚀
          </Link>
        </div>
      </div>
    </main>
  );
}
