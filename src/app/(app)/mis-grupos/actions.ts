"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_GROUPS = 3;

async function countActiveMemberships(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "rejected");
  return count ?? 0;
}

export async function createGroup(name: string, description: string): Promise<{ error?: string; groupId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const trimmedName = name.trim();
  if (trimmedName.length < 3) return { error: "El nombre debe tener al menos 3 caracteres" };
  if (trimmedName.length > 50) return { error: "El nombre no puede superar 50 caracteres" };

  const count = await countActiveMemberships(supabase, user.id);
  if (count >= MAX_GROUPS) return { error: `Solo puedes pertenecer a un máximo de ${MAX_GROUPS} grupos` };

  const isAppAdmin = user.email === process.env.ADMIN_EMAIL;

  const { data: group, error: groupError } = await supabase
    .from("private_groups")
    .insert({
      name: trimmedName,
      description: description.trim(),
      created_by: user.id,
      status: isAppAdmin ? "active" : "pending",
    })
    .select("id")
    .single();

  if (groupError || !group) return { error: "Error al crear el grupo" };

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "admin", status: "approved" });

  if (memberError) return { error: "Error al configurar el grupo" };

  revalidatePath("/mis-grupos");
  return { groupId: group.id };
}

export async function joinGroup(inviteCode: string): Promise<{ error?: string; groupId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const code = inviteCode.trim().toUpperCase();
  if (!code) return { error: "Ingresa un código de invitación" };

  const { data: group } = await supabase
    .from("private_groups")
    .select("id, status")
    .eq("invite_code", code)
    .single();

  if (!group) return { error: "Código de invitación inválido" };
  if (group.status !== "active") return { error: "Este grupo aún no está activo" };

  const { data: existing } = await supabase
    .from("group_members")
    .select("id, status")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "approved") return { error: "Ya eres miembro de este grupo" };
    if (existing.status === "pending") return { error: "Ya tienes una solicitud pendiente" };
    return { error: "Tu solicitud fue rechazada por el admin del grupo" };
  }

  const count = await countActiveMemberships(supabase, user.id);
  if (count >= MAX_GROUPS) return { error: `Solo puedes pertenecer a un máximo de ${MAX_GROUPS} grupos` };

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "member", status: "pending" });

  if (error) return { error: "Error al solicitar ingreso" };

  revalidatePath("/mis-grupos");
  return { groupId: group.id };
}

export async function approveGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return { error: "No autorizado" };

  const { error } = await supabase.rpc("update_private_group_status", {
    p_group_id: groupId,
    p_status: "active",
  });

  if (error) return { error: "Error al aprobar el grupo" };
  revalidatePath("/mis-grupos");
  return {};
}

export async function rejectGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return { error: "No autorizado" };

  const { error } = await supabase.rpc("update_private_group_status", {
    p_group_id: groupId,
    p_status: "rejected",
  });

  if (error) return { error: "Error al rechazar el grupo" };
  revalidatePath("/mis-grupos");
  return {};
}

export async function approveMember(memberId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("group_members")
    .update({ status: "approved" })
    .eq("id", memberId);

  if (error) return { error: "Error al aprobar miembro" };
  revalidatePath("/mis-grupos");
  return {};
}

export async function rejectMember(memberId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("group_members")
    .update({ status: "rejected" })
    .eq("id", memberId);

  if (error) return { error: "Error al rechazar miembro" };
  revalidatePath("/mis-grupos");
  return {};
}

export async function updateGroup(groupId: string, name: string, description: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const trimmedName = name.trim();
  if (trimmedName.length < 3) return { error: "El nombre debe tener al menos 3 caracteres" };
  if (trimmedName.length > 50) return { error: "El nombre no puede superar 50 caracteres" };

  const { error } = await supabase
    .from("private_groups")
    .update({ name: trimmedName, description: description.trim() })
    .eq("id", groupId)
    .eq("created_by", user.id);

  if (error) return { error: "Error al actualizar el grupo" };
  revalidatePath("/mis-grupos");
  revalidatePath(`/mis-grupos/${groupId}`);
  return {};
}

export async function deleteGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("private_groups")
    .delete()
    .eq("id", groupId)
    .eq("created_by", user.id);

  if (error) return { error: "Error al eliminar el grupo" };
  revalidatePath("/mis-grupos");
  return {};
}

export async function removeMember(memberId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId);

  if (error) return { error: "Error al eliminar miembro" };
  revalidatePath("/mis-grupos");
  return {};
}
