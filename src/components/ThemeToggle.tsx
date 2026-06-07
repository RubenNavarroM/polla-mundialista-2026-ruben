"use client";

import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: "light",  icon: "☀️", label: "Claro" },
  { value: "system", icon: "💻", label: "Sistema" },
  { value: "dark",   icon: "🌙", label: "Oscuro" },
];

interface Props {
  /** "pill" = compact 3-button pill (Navbar). "cards" = full labeled cards (Settings). */
  variant?: "pill" | "cards";
}

export function ThemeToggle({ variant = "pill" }: Props) {
  const { theme, setTheme } = useTheme();

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all text-sm font-semibold ${
              theme === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary"
            }`}
          >
            <span className="text-xl">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center bg-surface rounded-xl p-0.5 border border-border">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex items-center justify-center w-8 h-7 rounded-lg text-sm transition-all ${
            theme === opt.value
              ? "bg-bg text-text-primary shadow-card"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
