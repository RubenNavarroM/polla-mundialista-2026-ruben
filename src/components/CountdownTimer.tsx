"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: string;
  label?: string;
}

function calcTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ targetDate, label = "Para el primer partido" }: Props) {
  const [time, setTime] = useState<ReturnType<typeof calcTimeLeft>>(null);

  useEffect(() => {
    // Inicializa solo en el cliente para evitar hydration mismatch
    setTime(calcTimeLeft(targetDate));
    const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!time) return null;

  const units = [
    { value: time.days,    label: "días" },
    { value: time.hours,   label: "hrs" },
    { value: time.minutes, label: "min" },
    { value: time.seconds, label: "seg" },
  ];

  return (
    <div className="card bg-secondary border-secondary/20">
      <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
        ⏱ {label}
      </p>
      <div className="flex justify-center gap-3">
        {units.map(({ value, label: unit }) => (
          <div key={unit} className="flex flex-col items-center">
            <div className="bg-white/10 rounded-xl px-3 py-2 min-w-[52px] text-center">
              <span className="font-syne text-2xl font-bold text-white tabular-nums">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-white/50 text-xs mt-1">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
