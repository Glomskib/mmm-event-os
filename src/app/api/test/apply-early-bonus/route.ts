/**
 * DEV/TEST ONLY — apply early bonus for a specific registration.
 *
 * Guarded by CRON_SECRET. Never exposed in production (returns 404 if
 * NODE_ENV is "production" or CRON_SECRET is not set).
 */
import { NextResponse } from "next/server";
import { applyEarlyBonusForRegistration } from "@/lib/incentives";

export async function POST(request: Request) {
  // Hard-block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/, "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { registration_id } = body;

  if (!registration_id || typeof registration_id !== "string") {
    return NextResponse.json(
      { error: "registration_id is required" },
      { status: 400 }
    );
  }

  await applyEarlyBonusForRegistration(registration_id);

  return NextResponse.json({ ok: true });
}
