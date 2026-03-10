import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("volunteer_assignments")
    .insert({
      org_id: body.org_id,
      volunteer_id: body.volunteer_id,
      event_id: body.event_id,
      role: body.role,
      shift_start: body.shift_start,
      shift_end: body.shift_end,
      location: body.location,
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

  const { id, checked_in, ...rest } = await req.json();
  const db = createUntypedAdminClient();

  const updates: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
  if (typeof checked_in === "boolean") {
    updates.checked_in = checked_in;
    updates.checked_in_at = checked_in ? new Date().toISOString() : null;
  }

  const { data, error } = await db
    .from("volunteer_assignments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
