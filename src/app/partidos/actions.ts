"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMatch } from "@/lib/api-football";

export async function savePrediction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const matchId = formData.get("match_id") as string;
  const homeScore = parseInt(formData.get("home_score") as string, 10);
  const awayScore = parseInt(formData.get("away_score") as string, 10);

  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    return { error: "Marcador inválido" };
  }

  const match = await getMatch(matchId);
  if (match) {
    const kickoffPassed = new Date(match.date) <= new Date();
    if (match.status !== "scheduled" || kickoffPassed) {
      return { error: "Este partido ya comenzó, no puedes editar tu predicción" };
    }
  }

  const { error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
      },
      { onConflict: "user_id,match_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/partidos");
  return { success: true };
}
