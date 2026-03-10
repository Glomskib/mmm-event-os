import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("tasks")
    .insert({
      org_id: body.org_id,
      event_id: body.event_id,
      title: body.title,
      description: body.description,
      priority: body.priority,
      due_date: body.due_date,
      created_by: admin.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, ...rest } = await req.json();
  const db = createUntypedAdminClient();

  const updates: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
  if (status) {
    updates.status = status;
    if (status === "done") updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
  }

  const { data, error } = await db
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
