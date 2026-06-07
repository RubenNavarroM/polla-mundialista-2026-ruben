"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    redirect("/auth/username");
  }

  return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No se pudo iniciar sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile ? "/partidos" : "/auth/username");
}

export async function setupUsername(formData: FormData) {
  const supabase = await createClient();
  const username = (formData.get("username") as string).trim().toLowerCase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return { error: "Ese nombre de usuario ya está en uso. Intenta con otro." };
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  });

  if (error) {
    return { error: "No se pudo guardar el usuario. Intenta de nuevo." };
  }

  redirect("/partidos");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
