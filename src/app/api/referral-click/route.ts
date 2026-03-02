import { NextRequest, NextResponse } from "next/server";
import { writeSystemLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const { code } = (await request.json()) as { code?: string };

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "code is required" },
      { status: 400 }
    );
  }

  const referer = request.headers.get("referer") ?? null;
  const ua = request.headers.get("user-agent") ?? null;

  writeSystemLog("referral:click", `Referral link clicked: ${code}`, {
    code,
    referer,
    userAgent: ua,
  });

  return NextResponse.json({ ok: true });
}
