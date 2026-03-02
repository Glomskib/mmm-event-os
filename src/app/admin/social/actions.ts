"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import type { Json } from "@/lib/database.types";

interface CreateDraftInput {
  orgId: string;
  title: string;
  postText: string;
  channelTargets: Record<string, boolean>;
  scheduledFor: string | null;
  mediaUrls: string[] | null;
}

export async function createDraft(
  input: CreateDraftInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) {
    return { ok: false, error: "Unauthorized" };
  }

  const db = createAdminClient();

  const bodyJson: Record<string, unknown> = {
    content: input.postText,
  };

  const { data, error } = await db
    .from("approvals")
    .insert({
      org_id: input.orgId,
      type: "social_post",
      status: "draft",
      title: input.title,
      body_json: bodyJson as Json,
      channel_targets: input.channelTargets as Json,
      scheduled_for: input.scheduledFor ?? null,
      media_urls: input.mediaUrls,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id };
}
