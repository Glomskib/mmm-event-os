import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const body = await req.json();

    const { subject, preview_text, body_html, tags_filter } = body;
    if (!subject?.trim() || !body_html?.trim()) {
      return NextResponse.json(
        { error: "Subject and body are required." },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("email_campaigns")
      .insert({
        subject: subject.trim(),
        preview_text: preview_text || null,
        body_html: body_html.trim(),
        tags_filter: tags_filter || [],
        status: "draft",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[campaigns/create]", error);
      return NextResponse.json({ error: "Failed to create." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const body = await req.json();

    const { id, subject, preview_text, body_html, tags_filter } = body;
    if (!id || !subject?.trim() || !body_html?.trim()) {
      return NextResponse.json(
        { error: "ID, subject, and body are required." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("email_campaigns")
      .update({
        subject: subject.trim(),
        preview_text: preview_text || null,
        body_html: body_html.trim(),
        tags_filter: tags_filter || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "draft");

    if (error) {
      console.error("[campaigns/update]", error);
      return NextResponse.json({ error: "Failed to update." }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
