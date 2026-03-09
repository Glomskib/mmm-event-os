import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse("Missing email parameter.", { status: 400 });
  }

  const db = createAdminClient();

  await db
    .from("email_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase());

  return new NextResponse(
    `<!DOCTYPE html>
<html><head><title>Unsubscribed</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center">
  <h1>You've been unsubscribed</h1>
  <p>You won't receive any more emails from Making Miles Matter.</p>
  <p>Changed your mind? <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}">Visit our website</a> to re-subscribe.</p>
</body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}
