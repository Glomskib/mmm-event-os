import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, rideOccurrenceId } = await request.json();

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType required" },
      { status: 400 }
    );
  }

  // If rideOccurrenceId provided, scope to ride folder; otherwise legacy user folder
  const path = rideOccurrenceId
    ? `${rideOccurrenceId}/${user.id}-${Date.now()}.jpg`
    : `${user.id}/${Date.now()}-${filename}`;

  const { data, error } = await supabase.storage
    .from("checkins")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path,
    token: data.token,
  });
}
