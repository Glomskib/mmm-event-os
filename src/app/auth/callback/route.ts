import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // Fire welcome email (fire-and-forget, never block redirect)
    if (!error && data.user) {
      sendWelcomeEmail(data.user.id).catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Welcome email failed:", err);
        }
      });
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
