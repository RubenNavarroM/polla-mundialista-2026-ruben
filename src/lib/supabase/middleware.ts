import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rutas que requieren estar autenticado
  const protectedRoutes = [
    "/partidos",
    "/bracket",
    "/leaderboard",
    "/perfil",
    "/predicciones-locas",
    "/mis-grupos",
    "/auth/grupo",
  ];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from /auth but allow /auth/username and /auth/grupo
  if (user && pathname === "/auth") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = profile ? "/partidos" : "/auth/username";
    return NextResponse.redirect(url);
  }

  // Protect username setup — must be logged in
  if (!user && pathname === "/auth/username") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Para rutas protegidas (excepto /auth/grupo), verificar que el usuario
  // pertenezca al menos a un grupo (pendiente o activo)
  const requiresGroup = [
    "/partidos",
    "/bracket",
    "/leaderboard",
    "/perfil",
    "/predicciones-locas",
    "/mis-grupos",
  ];
  const needsGroupCheck = user && requiresGroup.some((route) => pathname.startsWith(route));

  if (needsGroupCheck) {
    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "rejected");

    if ((count ?? 0) === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/grupo";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
