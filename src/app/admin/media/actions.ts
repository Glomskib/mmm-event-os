"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import { getCurrentOrg } from "@/lib/org";
import type { MediaKind, MediaPlacement } from "@/lib/media";

type ActionResult = { ok: boolean; error?: string; id?: string };

export async function createMediaAsset(input: {
  entityId: string;
  kind: MediaKind;
  placement: MediaPlacement;
  url: string;
  title?: string;
  caption?: string;
}): Promise<ActionResult> {
  const adminUser = await getAdminOrNull();
  if (!adminUser) return { ok: false, error: "Unauthorized" };

  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Org not found" };

  const db = createAdminClient();

  // Auto sort_order: max + 1
  const { data: lastRow } = await db
    .from("media_assets")
    .select("sort_order")
    .eq("org_id", org.id)
    .eq("entity_id", input.entityId)
    .eq("placement", input.placement)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (lastRow?.sort_order ?? -1) + 1;

  const { data, error } = await db
    .from("media_assets")
    .insert({
      org_id: org.id,
      entity_type: "event",
      entity_id: input.entityId,
      kind: input.kind,
      placement: input.placement,
      url: input.url,
      title: input.title ?? null,
      caption: input.caption ?? null,
      sort_order: sortOrder,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/media");
  return { ok: true, id: data.id };
}

export async function addEmbedAsset(input: {
  entityId: string;
  placement: MediaPlacement;
  url: string;
  title?: string;
  caption?: string;
}): Promise<ActionResult> {
  return createMediaAsset({ ...input, kind: "embed" });
}

export async function updateMediaAsset(
  id: string,
  input: {
    title?: string | null;
    caption?: string | null;
    placement?: MediaPlacement;
  }
): Promise<ActionResult> {
  const adminUser = await getAdminOrNull();
  if (!adminUser) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const update: Record<string, unknown> = {};
  if ("title" in input) update.title = input.title;
  if ("caption" in input) update.caption = input.caption;
  if ("placement" in input) update.placement = input.placement;

  const { error } = await db.from("media_assets").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function toggleMediaActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const adminUser = await getAdminOrNull();
  if (!adminUser) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("media_assets")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteMediaAsset(id: string): Promise<ActionResult> {
  const adminUser = await getAdminOrNull();
  if (!adminUser) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("media_assets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function moveMediaAsset(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const adminUser = await getAdminOrNull();
  if (!adminUser) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();

  // Get current asset
  const { data: current } = await db
    .from("media_assets")
    .select("id, sort_order, entity_id, placement")
    .eq("id", id)
    .single();

  if (!current) return { ok: false, error: "Asset not found" };

  // Get all siblings in the same entity+placement, ordered by sort_order
  const { data: siblings } = await db
    .from("media_assets")
    .select("id, sort_order")
    .eq("entity_id", current.entity_id)
    .eq("placement", current.placement)
    .order("sort_order", { ascending: true });

  const all = siblings ?? [];
  const idx = all.findIndex((r) => r.id === id);
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;

  if (targetIdx < 0 || targetIdx >= all.length) return { ok: true }; // boundary

  const neighbor = all[targetIdx];

  // Swap sort_orders
  await Promise.all([
    db
      .from("media_assets")
      .update({ sort_order: neighbor.sort_order })
      .eq("id", current.id),
    db
      .from("media_assets")
      .update({ sort_order: current.sort_order })
      .eq("id", neighbor.id),
  ]);

  revalidatePath("/admin/media");
  return { ok: true };
}
