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

  const { filename, contentType } = await request.json();

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType required" },
      { status: 400 }
    );
  }

  // Scope uploads to user's folder: {user_id}/{timestamp}-{filename}
  const path = `${user.id}/${Date.now()}-${filename}`;

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
