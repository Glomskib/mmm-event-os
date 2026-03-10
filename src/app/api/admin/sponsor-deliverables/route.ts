import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("sponsorship_deliverables")
    .insert({
      org_id: body.org_id,
      sponsor_id: body.sponsor_id,
      event_id: body.event_id,
      title: body.title,
      description: body.description,
      due_date: body.due_date,
      notes: body.notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  const db = createUntypedAdminClient();

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "done") {
    updates.completed_at = new Date().toISOString();
    updates.completed_by = admin.id;
  }

  const { data, error } = await db
    .from("sponsorship_deliverables")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
