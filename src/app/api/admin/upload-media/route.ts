import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

const ALLOWED_IMAGE_VIDEO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
const GPX_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function isGpxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".gpx");
}

export async function POST(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const entityId = formData.get("entity_id") as string | null;
  const placement = formData.get("placement") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!entityId) {
    return NextResponse.json({ error: "entity_id is required" }, { status: 400 });
  }
  if (!placement) {
    return NextResponse.json({ error: "placement is required" }, { status: 400 });
  }

  const gpx = isGpxFile(file);

  if (!gpx && !ALLOWED_IMAGE_VIDEO_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, GPX." },
      { status: 400 }
    );
  }

  const sizeLimit = gpx ? GPX_MAX_SIZE : MAX_SIZE;
  if (file.size > sizeLimit) {
    return NextResponse.json(
      { error: `File too large. Maximum ${gpx ? "10" : "25"} MB.` },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `events/${entityId}/${placement}/${Date.now()}_${safeName}`;

  // GPX files are XML text; use explicit content type
  const contentType = gpx
    ? "application/gpx+xml"
    : file.type;

  const db = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await db.storage
    .from("media")
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from("media").getPublicUrl(storagePath);

  const kind = gpx ? "file" : file.type.startsWith("video/") ? "video" : "image";

  return NextResponse.json({
    url: urlData.publicUrl,
    path: storagePath,
    kind,
  });
}
