import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import { getFromAddress, sendEmail } from "@/lib/resend";
import { writeSystemLog } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await request.json()) as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: approval } = await db
    .from("approvals")
    .select("*")
    .eq("id", id)
    .eq("org_id", admin.org_id)
    .single();

  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (approval.status !== "approved") {
    return NextResponse.json(
      { error: `Cannot send — current status is '${approval.status}'. Must be 'approved' first.` },
      { status: 400 }
    );
  }

  if (!approval.body_html) {
    return NextResponse.json(
      { error: "No HTML body to send" },
      { status: 400 }
    );
  }

  // Determine recipients based on approval type
  if (approval.type === "weekly_ride_email") {
    const { data: profiles } = await db
      .from("profiles")
      .select("email")
      .eq("org_id", admin.org_id)
      .eq("marketing_opt_in", true)
      .not("email", "is", null);

    const recipients = profiles ?? [];

    let sent = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      const result = await sendEmail(
        {
          from: getFromAddress(),
          to: recipient.email,
          subject: approval.title,
          html: approval.body_html,
        },
        "approval-weekly-ride"
      );
      if (result.success) {
        sent++;
      } else {
        errors.push(`${recipient.email}: ${result.error ?? "Unknown error"}`);
      }
    }

    // Mark as sent
    await db
      .from("approvals")
      .update({ status: "sent" })
      .eq("id", id);

    writeSystemLog("approval:send", `Sent: ${approval.title}`, {
      approvalId: id,
      sentBy: admin.id,
      emailsSent: sent,
      emailErrors: errors.length,
    });

    return NextResponse.json({
      ok: true,
      emailsSent: sent,
      emailErrors: errors.length,
    });
  }

  // Generic fallback: mark as sent (for social posts or future types)
  await db
    .from("approvals")
    .update({ status: "sent" })
    .eq("id", id);

  writeSystemLog("approval:send", `Sent: ${approval.title}`, {
    approvalId: id,
    sentBy: admin.id,
    type: approval.type,
  });

  return NextResponse.json({ ok: true });
}
