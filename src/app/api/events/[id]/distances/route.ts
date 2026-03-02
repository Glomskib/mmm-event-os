import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDistances } from "@/lib/pricing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, status")
    .eq("id", id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const distances = getDistances(event.title);

  return NextResponse.json({
    event_id: event.id,
    title: event.title,
    distances,
  });
}
