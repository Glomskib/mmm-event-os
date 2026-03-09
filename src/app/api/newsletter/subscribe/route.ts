import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { email, name, source, tags } = await req.json();

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { error } = await db.from("email_subscribers").upsert(
      {
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        source: source || "website",
        tags: tags || ["newsletter"],
        unsubscribed_at: null, // re-subscribe if they come back
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("[newsletter/subscribe]", error);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter/subscribe]", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
