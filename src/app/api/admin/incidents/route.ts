import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("incident_reports")
    .insert({
      org_id: body.org_id,
      event_id: body.event_id,
      severity: body.severity,
      category: body.category,
      title: body.title,
      description: body.description,
      location: body.location,
      rider_name: body.rider_name,
      rider_email: body.rider_email,
      reported_by: admin.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, resolution } = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("incident_reports")
    .update({
      resolution,
      resolved_at: new Date().toISOString(),
      resolved_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
