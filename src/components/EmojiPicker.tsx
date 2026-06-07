"use client";

import { useState } from "react";

const EMOJIS = [
  "🦁","🐯","🦅","🐺","🦊","🐻","🦈","🦋","🐉","🦄",
  "⚽","🏆","🎯","🔥","💪","🌟","👑","🎪","🚀","💎",
  "🇨🇴","🇦🇷","🇧🇷","🇲🇽","🇺🇸","🇫🇷","🇩🇪","🇪🇸","🇵🇹","🇺🇾",
];

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl hover:opacity-90 transition border-2 border-border"
        title="Cambiar avatar"
      >
        {value || "😀"}
      </button>
      <span className="absolute -bottom-1 -right-1 text-xs bg-bg border border-border rounded-full w-5 h-5 flex items-center justify-center">✏️</span>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-bg border border-border rounded-2xl shadow-card-hover p-3 grid grid-cols-5 gap-1.5 w-52">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onChange(e); setOpen(false); }}
              className={`text-2xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface transition ${value === e ? "bg-primary/10 ring-2 ring-primary" : ""}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
