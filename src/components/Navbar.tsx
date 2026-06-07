"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { ThemeToggle } from "./ThemeToggle";

const mobileLinks = [
  { href: "/partidos",           label: "Partidos", icon: "⚽" },
  { href: "/leaderboard",        label: "Ranking",  icon: "🏆" },
  { href: "/predicciones-locas", label: "Locas",    icon: "🎲" },
  { href: "/grupos",             label: "Grupos",   icon: "📊" },
  { href: "/perfil",             label: "Perfil",   icon: "👤" },
];

const desktopLinks = [
  ...mobileLinks,
  { href: "/bracket", label: "Bracket", icon: "🗂️" },
  { href: "/reglas",  label: "Reglas",  icon: "📋" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-bg sticky top-0 z-50">
        <Link href="/partidos" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <div>
            <p className="font-syne font-bold text-secondary text-sm leading-none">Polla Mundialista</p>
            <p className="font-syne text-primary text-xs font-semibold">FIFA World Cup 2026</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {desktopLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                pathname.startsWith(l.href)
                  ? "bg-secondary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}

          <div className="ml-2">
            <ThemeToggle variant="pill" />
          </div>

          <form action={signOut} className="ml-1">
            <button className="text-sm text-text-secondary hover:text-error transition px-3 py-2 rounded-xl hover:bg-surface">
              Salir
            </button>
          </form>
        </nav>
      </header>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg border-t border-border z-50 flex">
        {mobileLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
              pathname.startsWith(l.href)
                ? "text-primary"
                : "text-text-secondary"
            }`}
          >
            <span className="text-lg">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
