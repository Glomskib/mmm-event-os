import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishPost } from "@/lib/late";
import { createLogger, writeSystemLog } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

export const maxDuration = 60;

const log = createLogger("cron:social-publish");

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timer = log.timed("execute");
  const db = createAdminClient();

  // Find social posts that are approved/scheduled and past their scheduled_for time
  const now = new Date().toISOString();
  const { data: posts, error: fetchError } = await db
    .from("approvals")
    .select("*")
    .eq("type", "social_post")
    .in("status", ["approved", "scheduled"])
    .not("scheduled_for", "is", null)
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true });

  if (fetchError) {
    log.error("Failed to fetch scheduled posts", { error: fetchError.message });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    const durationMs = timer.end({ postsFound: 0 });
    return NextResponse.json({ ok: true, published: 0, failed: 0, durationMs });
  }

  let published = 0;
  let failed = 0;

  for (const approval of posts) {
    const bodyJson = approval.body_json as Record<string, unknown> | null;
    const content = (bodyJson?.content as string) ?? approval.title;
    const channelTargets =
      (approval.channel_targets as Record<string, boolean> | null) ?? {};
    const mediaUrls = (approval.media_urls as string[] | null) ?? [];

    const activeChannels = Object.keys(channelTargets).filter(
      (k) => channelTargets[k]
    );

    if (activeChannels.length === 0) {
      await db
        .from("approvals")
        .update({ error_message: "No channel targets configured" })
        .eq("id", approval.id);
      failed++;
      continue;
    }

    writeSystemLog("late:publish_attempt", `Cron publishing: ${approval.title}`, {
      approvalId: approval.id,
      channels: activeChannels,
      scheduledFor: approval.scheduled_for,
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
        .eq("id", approval.id);

      writeSystemLog("late:publish_success", `Published: ${approval.title}`, {
        approvalId: approval.id,
        postId: result.postId,
        channels: activeChannels,
      });

      published++;
    } else {
      await db
        .from("approvals")
        .update({
          error_message: result.error ?? "Unknown error",
          publish_result: (result.data ?? null) as Json,
          // Keep status as-is (approved/scheduled) so it can be retried
        })
        .eq("id", approval.id);

      writeSystemLog("late:publish_fail", `Failed: ${approval.title}`, {
        approvalId: approval.id,
        error: result.error,
        channels: activeChannels,
      });

      failed++;
    }
  }

  const durationMs = timer.end({ postsFound: posts.length, published, failed });

  writeSystemLog("cron:social-publish", "Execution complete", {
    postsFound: posts.length,
    published,
    failed,
    durationMs,
  });

  return NextResponse.json({ ok: true, published, failed, durationMs });
}
