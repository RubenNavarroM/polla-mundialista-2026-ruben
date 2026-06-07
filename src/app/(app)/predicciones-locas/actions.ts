"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcAllPoints } from "@/lib/crazy-questions";
import type { CrazyAnswer } from "@/types/database";

export async function submitCrazyAnswer(jornadaId: string, value: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: jornada } = await supabase
    .from("crazy_jornadas")
    .select("deadline")
    .eq("id", jornadaId)
    .single();

  if (!jornada) return { error: "Jornada no encontrada" };

  const now = new Date();
  const deadline = new Date(jornada.deadline);
  if (now >= deadline) return { error: "El tiempo de predicción ha cerrado" };

  const answeredBeforeDeadline = now < deadline;

  const { error } = await supabase.from("crazy_answers").upsert(
    {
      user_id: user.id,
      jornada_id: jornadaId,
      value,
      answered_before_deadline: answeredBeforeDeadline,
      submitted_at: now.toISOString(),
    },
    { onConflict: "user_id,jornada_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/predicciones-locas");
  return { success: true };
}

export async function updateJornadaResult(jornadaId: string, realValue: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Perfil no encontrado" };

  const adminEmail = process.env.ADMIN_EMAIL;
  const { data: { user: fullUser } } = await supabase.auth.getUser();
  if (adminEmail && fullUser?.email !== adminEmail) {
    return { error: "No tienes permisos de administrador" };
  }

  const { error: updateError } = await supabase
    .from("crazy_jornadas")
    .update({ real_value: realValue })
    .eq("id", jornadaId);

  if (updateError) return { error: updateError.message };

  // Calculate points for all answers
  await calculatePoints(jornadaId, realValue, supabase);

  revalidatePath("/predicciones-locas");
  revalidatePath("/leaderboard");
  return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function calculatePoints(jornadaId: string, realValue: number, supabase: any) {
  const { data: answers } = await supabase
    .from("crazy_answers")
    .select("user_id, value, answered_before_deadline")
    .eq("jornada_id", jornadaId);

  if (!answers || answers.length === 0) return;

  const results = calcAllPoints(answers as CrazyAnswer[], realValue);

  for (const result of results) {
    await supabase
      .from("crazy_answers")
      .update({ points: result.points })
      .eq("jornada_id", jornadaId)
      .eq("user_id", result.user_id);
  }
}

export async function getOrCreateJornada(
  jornadaDate: string,
  firstMatchAt: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Check existing
  const { data: existing } = await supabase
    .from("crazy_jornadas")
    .select("*, crazy_questions(*)")
    .eq("jornada_date", jornadaDate)
    .maybeSingle();

  if (existing) return { data: existing };

  // Find used questions
  const { data: usedJornadas } = await supabase
    .from("crazy_jornadas")
    .select("question_id");

  const usedIds = new Set((usedJornadas ?? []).map((j: { question_id: string }) => j.question_id));

  const { data: allQuestions } = await supabase
    .from("crazy_questions")
    .select("*");

  let available = (allQuestions ?? []).filter(
    (q: { id: string }) => !usedIds.has(q.id)
  );
  if (available.length === 0) available = allQuestions ?? [];

  if (available.length === 0) return { error: "Sin preguntas disponibles" };

  const question = available[Math.floor(Math.random() * available.length)];
  const deadline = new Date(new Date(firstMatchAt).getTime() - 30 * 60 * 1000).toISOString();

  const { data: newJornada, error } = await supabase
    .from("crazy_jornadas")
    .insert({
      jornada_date: jornadaDate,
      question_id: question.id,
      deadline,
      first_match_at: firstMatchAt,
    })
    .select("*, crazy_questions(*)")
    .single();

  if (error) {
    // Race condition — fetch existing
    const { data: existing2 } = await supabase
      .from("crazy_jornadas")
      .select("*, crazy_questions(*)")
      .eq("jornada_date", jornadaDate)
      .single();
    if (existing2) return { data: existing2 };
    return { error: error.message };
  }

  return { data: newJornada };
}
