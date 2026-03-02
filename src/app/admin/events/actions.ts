"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import { slugify } from "@/lib/event-slug";

type EventStatus = "draft" | "published" | "cancelled";

export async function setEventStatus(
  eventId: string,
  status: EventStatus
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("events")
    .update({ status })
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createEvent(input: {
  orgId: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  seriesKey?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();

  // Generate slug — ensure uniqueness by appending timestamp if needed
  let slug = slugify(input.title);
  const { data: existing } = await db
    .from("events")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (existing && existing.length > 0) {
    slug = `${slug}-${Date.now()}`;
  }

  const { data, error } = await db
    .from("events")
    .insert({
      org_id: input.orgId,
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      date: input.date,
      slug,
      series_key: input.seriesKey || "hhh",
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function updateEvent(
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    location?: string;
    date?: string;
    registrationOpen?: boolean;
    capacity?: number | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const updateObj: Record<string, unknown> = {};
  if (updates.title !== undefined) {
    updateObj.title = updates.title;
    updateObj.slug = slugify(updates.title);
  }
  if (updates.description !== undefined)
    updateObj.description = updates.description || null;
  if (updates.location !== undefined)
    updateObj.location = updates.location || null;
  if (updates.date !== undefined) updateObj.date = updates.date;
  if (updates.registrationOpen !== undefined)
    updateObj.registration_open = updates.registrationOpen;
  if (updates.capacity !== undefined) updateObj.capacity = updates.capacity;

  const { error } = await db
    .from("events")
    .update(updateObj)
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
