"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveBracketPrediction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const champion_team = formData.get("champion_team") as string;
  const runner_up = formData.get("runner_up") as string;
  const third_place = formData.get("third_place") as string;

  if (!champion_team) return { error: "Debes elegir un campeón" };
  if (champion_team === runner_up) return { error: "El campeón y subcampeón no pueden ser el mismo equipo" };
  if (champion_team === third_place || runner_up === third_place) {
    return { error: "Los tres equipos deben ser distintos" };
  }

  const { error } = await supabase
    .from("bracket_predictions")
    .upsert(
      { user_id: user.id, champion_team, runner_up: runner_up || null, third_place: third_place || null },
      { onConflict: "user_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/bracket");
  return { success: true };
}
