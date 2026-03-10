import { NextRequest, NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message, emergency_contact_name, emergency_contact_phone, shirt_size } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const db = createUntypedAdminClient();

    const emailNorm = email.trim().toLowerCase();

    // Upsert by email — if they sign up again, update their info
    const { error } = await db.from("volunteer_signups").upsert(
      {
        name: name.trim(),
        email: emailNorm,
        phone: phone?.trim() || null,
        message: message?.trim() || null,
        emergency_contact_name: emergency_contact_name?.trim() || null,
        emergency_contact_phone: emergency_contact_phone?.trim() || null,
        shirt_size: shirt_size || null,
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("[volunteer/signup]", error);
      return NextResponse.json(
        { error: "Failed to save. Please try again." },
        { status: 500 }
      );
    }

    // Also add to email subscribers with "volunteer" tag
    await db.from("email_subscribers").upsert(
      {
        email: emailNorm,
        name: name.trim(),
        source: "volunteer_signup",
        tags: ["newsletter", "volunteer"],
        unsubscribed_at: null,
      },
      { onConflict: "email" }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[volunteer/signup]", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
