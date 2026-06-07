"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Team } from "@/types/api";

interface Props {
  name: string;
  teams: Team[];
  value: string;
  onChange: (teamName: string) => void;
  placeholder?: string;
  exclude?: string[];
}

export function TeamSelector({ name, teams, value, onChange, placeholder = "Elige un equipo", exclude = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => t.name === value);
  const filtered = teams.filter(
    (t) =>
      !exclude.includes(t.name) &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-white hover:border-primary/40 transition text-left"
      >
        {selected ? (
          <>
            {selected.flag ? (
              <Image
                src={selected.flag}
                alt={selected.name}
                width={28}
                height={19}
                className="rounded object-cover flex-shrink-0"
                unoptimized
              />
            ) : (
              <span className="w-7 h-5 bg-surface rounded flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0">
                {selected.code}
              </span>
            )}
            <span className="font-semibold text-text-primary">{selected.name}</span>
          </>
        ) : (
          <span className="text-text-secondary">{placeholder}</span>
        )}
        <span className="ml-auto text-text-secondary">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-card-hover overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipo..."
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-surface border border-border focus:outline-none focus:border-primary"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-4">Sin resultados</p>
            ) : (
              filtered.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => { onChange(team.name); setOpen(false); setSearch(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface transition text-left ${
                    value === team.name ? "bg-primary/5" : ""
                  }`}
                >
                  {team.flag ? (
                    <Image
                      src={team.flag}
                      alt={team.name}
                      width={24}
                      height={16}
                      className="rounded object-cover flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <span className="w-6 h-4 bg-surface rounded text-xs font-bold text-text-secondary flex items-center justify-center flex-shrink-0">
                      {team.code}
                    </span>
                  )}
                  <span className="text-sm text-text-primary">{team.name}</span>
                  {value === team.name && <span className="ml-auto text-primary text-sm">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
