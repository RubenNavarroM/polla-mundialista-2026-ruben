import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupOnboardingForms } from "./GroupOnboardingForms";

export default async function GrupoOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Si ya tiene un grupo, no hay nada que hacer aquí
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "rejected");

  if ((count ?? 0) > 0) redirect("/partidos");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-4xl mb-3">👥</p>
          <h1 className="font-syne text-2xl font-bold text-secondary">Únete a un grupo</h1>
          <p className="text-text-secondary text-sm mt-2">
            Para participar en la polla necesitas pertenecer a un grupo.
            Crea el tuyo o únete al de un amigo.
          </p>
        </div>

        {/* Forms */}
        <div className="card">
          <GroupOnboardingForms />
        </div>
      </div>
    </div>
  );
}
