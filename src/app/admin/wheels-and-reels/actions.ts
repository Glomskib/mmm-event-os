"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function addFilm(input: {
  orgId: string;
  title: string;
  description?: string;
  trailerUrl?: string;
  posterUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("films").insert({
    org_id: input.orgId,
    title: input.title,
    description: input.description || null,
    trailer_url: input.trailerUrl || null,
    poster_url: input.posterUrl || null,
    active: true,
    added_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleFilmActive(
  filmId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();

  const { data: film } = await db
    .from("films")
    .select("active")
    .eq("id", filmId)
    .single();

  if (!film) return { ok: false, error: "Film not found" };

  const { error } = await db
    .from("films")
    .update({ active: !film.active })
    .eq("id", filmId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFilm(
  filmId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("films").delete().eq("id", filmId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
