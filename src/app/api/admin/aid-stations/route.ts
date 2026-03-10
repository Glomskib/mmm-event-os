import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("aid_stations")
    .insert({
      org_id: body.org_id,
      event_id: body.event_id,
      name: body.name,
      location: body.location,
      mile_marker: body.mile_marker,
      captain_name: body.captain_name,
      captain_phone: body.captain_phone,
      water_gallons: body.water_gallons,
      food_items: body.food_items,
      medical_kit: body.medical_kit,
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

  const { id, ...updates } = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("aid_stations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
