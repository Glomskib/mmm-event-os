import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function POST(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `social/${admin.id}-${Date.now()}.${ext}`;

  const db = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from("checkins")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  // Generate a long-lived signed URL (1 year) so Late.dev can access it
  const { data: signedData, error: signError } = await db.storage
    .from("checkins")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signError || !signedData) {
    return NextResponse.json(
      { error: signError?.message ?? "Failed to create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signedData.signedUrl, path });
}
