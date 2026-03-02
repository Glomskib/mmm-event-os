import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";

function safeRedirectPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  // Only allow internal relative paths (starts with "/" but not "//")
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Support both `next` (new register flow) and `redirect` (existing login/magic-link)
  const redirectPath = safeRedirectPath(
    searchParams.get("next") ?? searchParams.get("redirect"),
    "/events"
  );

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

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
