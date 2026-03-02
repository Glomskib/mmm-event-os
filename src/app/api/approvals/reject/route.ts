import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import { writeSystemLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, notes } = (await request.json()) as {
    id: string;
    notes?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: approval } = await db
    .from("approvals")
    .select("id, status, org_id, title")
    .eq("id", id)
    .eq("org_id", admin.org_id)
    .single();

  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (approval.status !== "draft" && approval.status !== "approved") {
    return NextResponse.json(
      { error: `Cannot reject — current status is '${approval.status}'` },
      { status: 400 }
    );
  }

  const { error } = await db
    .from("approvals")
    .update({
      status: "rejected",
      rejected_by: admin.id,
      reviewer_notes: notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  writeSystemLog("approval:reject", `Rejected: ${approval.title}`, {
    approvalId: id,
    rejectedBy: admin.id,
    notes: notes ?? null,
  });

  return NextResponse.json({ ok: true });
}
