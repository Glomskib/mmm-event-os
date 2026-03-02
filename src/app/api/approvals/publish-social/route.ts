import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
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

  if (approval.type !== "social_post") {
    return NextResponse.json(
      { error: `Not a social post (type='${approval.type}')` },
      { status: 400 }
    );
  }

  if (approval.status !== "approved" && approval.status !== "scheduled") {
    return NextResponse.json(
      {
        error: `Cannot publish — current status is '${approval.status}'. Must be 'approved' or 'scheduled'.`,
      },
      { status: 400 }
    );
  }

  // Check for future scheduled_for → set scheduled status
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

  // Extract post content from body_json
  const bodyJson = approval.body_json as Record<string, unknown> | null;
  const content =
    (bodyJson?.content as string) ?? approval.title;

  const channelTargets =
    (approval.channel_targets as Record<string, boolean> | null) ?? {};

  const mediaUrls = (approval.media_urls as string[] | null) ?? [];

  if (Object.keys(channelTargets).length === 0) {
    return NextResponse.json(
      { error: "No channel_targets set on this approval" },
      { status: 400 }
    );
  }

  writeSystemLog("late:publish_attempt", `Publishing: ${approval.title}`, {
    approvalId: id,
    channels: Object.keys(channelTargets).filter((k) => channelTargets[k]),
    publishedBy: admin.id,
  });

  const result = await publishPost({
    content,
    channelTargets,
    mediaUrls,
  });

  if (result.success) {
    await db
      .from("approvals")
      .update({
        status: "sent",
        publish_result: (result.data ?? {}) as Json,
        published_url: null, // Late.dev doesn't return a direct URL
        error_message: null,
      })
      .eq("id", id);

    writeSystemLog("late:publish_success", `Published: ${approval.title}`, {
      approvalId: id,
      postId: result.postId,
      publishedBy: admin.id,
    });

    return NextResponse.json({
      ok: true,
      postId: result.postId,
    });
  } else {
    // Store error but keep status as approved so admin can retry
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

    return NextResponse.json(
      {
        ok: false,
        error: result.error,
      },
      { status: 502 }
    );
  }
}
