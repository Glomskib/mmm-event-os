import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/require-admin";
import { checkLateHealth } from "@/lib/late";

export async function GET() {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.LATE_API_KEY) {
    return NextResponse.json({
      ok: false,
      error: "LATE_API_KEY not configured",
    });
  }

  const result = await checkLateHealth();
  return NextResponse.json(result);
}
