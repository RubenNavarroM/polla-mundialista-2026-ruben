import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = request.nextUrl.searchParams.get("token");

  const isAuthorized =
    (process.env.CRON_SECRET &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
    (process.env.CRON_SECRET && token === process.env.CRON_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("matches");
  revalidatePath("/partidos");
  revalidatePath("/leaderboard");

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
  });
}
