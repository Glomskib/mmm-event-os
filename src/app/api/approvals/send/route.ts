import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import { getFromAddress, sendEmail } from "@/lib/resend";
import { publishPost } from "@/lib/late";
import { writeSystemLog } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

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

  const allowedStatuses =
    approval.type === "social_post"
      ? ["approved", "scheduled"]
      : ["approved"];

  if (!allowedStatuses.includes(approval.status)) {
    return NextResponse.json(
      { error: `Cannot send — current status is '${approval.status}'. Must be 'approved' first.` },
      { status: 400 }
    );
  }

  // ── Weekly Ride Email ───────────────────────────────────────────
  if (approval.type === "weekly_ride_email") {
    if (!approval.body_html) {
      return NextResponse.json(
        { error: "No HTML body to send" },
        { status: 400 }
      );
    }

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

  // ── Social Post → Late.dev ──────────────────────────────────────
  if (approval.type === "social_post") {
    const bodyJson = approval.body_json as Record<string, unknown> | null;
    const content = (bodyJson?.content as string) ?? approval.title;
    const channelTargets =
      (approval.channel_targets as Record<string, boolean> | null) ?? {};
    const mediaUrls = (approval.media_urls as string[] | null) ?? [];

    if (Object.keys(channelTargets).length === 0) {
      return NextResponse.json(
        { error: "No channel_targets set on this approval" },
        { status: 400 }
      );
    }

    // Check scheduled_for in future
    if (approval.scheduled_for) {
      const scheduledTime = new Date(approval.scheduled_for);
      if (scheduledTime > new Date()) {
        await db
          .from("approvals")
          .update({ status: "scheduled" })
          .eq("id", id);

        writeSystemLog("approval:schedule", `Scheduled: ${approval.title}`, {
          approvalId: id,
          scheduledFor: approval.scheduled_for,
        });

        return NextResponse.json({
          ok: true,
          mode: "scheduled",
          scheduledFor: approval.scheduled_for,
        });
      }
    }

    writeSystemLog("late:publish_attempt", `Publishing: ${approval.title}`, {
      approvalId: id,
      channels: Object.keys(channelTargets).filter((k) => channelTargets[k]),
      publishedBy: admin.id,
    });

    const result = await publishPost({ content, channelTargets, mediaUrls });

    if (result.success) {
      await db
        .from("approvals")
        .update({
          status: "sent",
          publish_result: (result.data ?? {}) as Json,
          error_message: null,
        })
        .eq("id", id);

      writeSystemLog("late:publish_success", `Published: ${approval.title}`, {
        approvalId: id,
        postId: result.postId,
        publishedBy: admin.id,
      });

      return NextResponse.json({ ok: true, postId: result.postId });
    }

    // Publish failed — keep approved so admin can retry
    await db
      .from("approvals")
      .update({
        error_message: result.error ?? "Unknown error",
        publish_result: (result.data ?? null) as Json,
      })
      .eq("id", id);

    writeSystemLog("late:publish_fail", `Failed: ${approval.title}`, {
      approvalId: id,
      error: result.error,
      publishedBy: admin.id,
    });

    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  // ── Generic fallback ────────────────────────────────────────────
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
