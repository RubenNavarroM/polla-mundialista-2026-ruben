"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient();
  const avatar_url = formData.get("avatar_url") as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { error } = await supabase.from("profiles").update({ avatar_url }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/perfil");
  return { success: true };
}

export async function updateUsername(formData: FormData) {
  const supabase = await createClient();
  const username = (formData.get("username") as string).trim().toLowerCase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "Solo letras, números y _ (3–20 caracteres)" };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) return { error: "Ese nombre ya está en uso" };

  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/perfil");
  return { success: true };
}
