"use client";

import { useEffect, useState } from "react";

interface Props {
  deadline: string;
}

function calcLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CrazyCountdown({ deadline }: Props) {
  const [time, setTime] = useState<ReturnType<typeof calcLeft>>(null);

  useEffect(() => {
    setTime(calcLeft(deadline));
    const id = setInterval(() => setTime(calcLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!time) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-error font-semibold">
        <span>🔒</span>
        <span>Predicciones cerradas</span>
      </div>
    );
  }

  const units = [
    { value: time.hours, label: "hrs" },
    { value: time.minutes, label: "min" },
    { value: time.seconds, label: "seg" },
  ];

  return (
    <div className="text-center">
      <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">
        ⏳ Cierre en
      </p>
      <div className="flex justify-center gap-2">
        {units.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="bg-primary/10 rounded-xl px-3 py-1.5 min-w-[44px] text-center">
              <span className="font-syne text-xl font-bold text-primary tabular-nums">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-text-secondary text-xs mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
