import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import { writeSystemLog } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, title, body_json, body_html } = body as {
    type: string;
    title: string;
    body_json?: Record<string, unknown>;
    body_html?: string;
  };

  if (!type || !title) {
    return NextResponse.json(
      { error: "type and title are required" },
      { status: 400 }
    );
  }

  const db = createAdminClient();

  const { data, error } = await db
    .from("approvals")
    .insert({
      org_id: admin.org_id,
      type,
      title,
      body_json: (body_json ?? null) as Json,
      body_html: body_html ?? null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  writeSystemLog("approval:create", `Created approval: ${title}`, {
    approvalId: data.id,
    type,
    createdBy: admin.id,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
