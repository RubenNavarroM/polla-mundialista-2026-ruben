"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  trigger: boolean;
  type?: "exact" | "correct";
}

export function ConfettiEffect({ trigger, type = "exact" }: Props) {
  useEffect(() => {
    if (!trigger) return;

    if (type === "exact") {
      // Lluvia completa para marcador exacto
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#B22234", "#002868", "#FFD700", "#ffffff"],
      });
    } else {
      // Confetti suave para resultado correcto
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#16A34A", "#ffffff"],
        scalar: 0.8,
      });
    }
  }, [trigger, type]);

  return null;
}
