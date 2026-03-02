"use server";

import { randomUUID } from "crypto";
import { getAdminOrNull } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeSystemLog } from "@/lib/logger";
import type { NormalizedImportRow } from "@/lib/hhh-csv-parse";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportResult {
  ok: boolean;
  error?: string;
  requestId?: string;
  inserted: number;
  updated: number;
  matched: number;
  unmatched: number;
}

export interface ImportedRow {
  id: string;
  order_id: string;
  order_name: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  distance_label: string | null;
  miles: number;
  event_year: number;
  financial_status: string | null;
  imported_at: string;
  matched_user_id: string | null;
}

// ── Import action ─────────────────────────────────────────────────────────────

export async function importHhhRows(
  rows: NormalizedImportRow[]
): Promise<ImportResult> {
  const requestId = randomUUID().slice(0, 8);

  const admin_user = await getAdminOrNull();
  if (!admin_user) {
    await writeSystemLog("hhh:import_error", "Unauthorized import attempt", { requestId });
    return { ok: false, error: "Unauthorized", requestId, inserted: 0, updated: 0, matched: 0, unmatched: 0 };
  }

  if (rows.length === 0) {
    return { ok: true, requestId, inserted: 0, updated: 0, matched: 0, unmatched: 0 };
  }

  await writeSystemLog("hhh:import_run", `Starting import of ${rows.length} rows`, {
    requestId,
    by: admin_user.id,
    rowCount: rows.length,
  });

  const admin = createAdminClient();
  const org_id = admin_user.org_id;

  try {
    // ── Email → profile ID mapping ────────────────────────────────────────────
    const emails = [...new Set(rows.map((r) => r.email))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("email", emails);

    const emailToUserId = new Map<string, string>(
      (profiles ?? []).map((p) => [p.email.toLowerCase(), p.id])
    );

    // ── Pre-check existing order IDs (for insert vs update counts) ────────────
    const orderIds = rows.map((r) => r.order_id);
    const { data: existing } = await admin
      .from("hhh_shopify_imports")
      .select("order_id")
      .eq("org_id", org_id)
      .in("order_id", orderIds);

    const existingSet = new Set((existing ?? []).map((r) => r.order_id));

    let inserted = 0;
    let updated = 0;
    let matched = 0;
    let unmatched = 0;

    // ── Build upsert records ──────────────────────────────────────────────────
    const now = new Date().toISOString();
    const records = rows.map((row) => {
      const matched_user_id = emailToUserId.get(row.email) ?? null;

      if (existingSet.has(row.order_id)) updated++;
      else inserted++;

      if (matched_user_id) matched++;
      else unmatched++;

      return {
        org_id,
        order_id: row.order_id,
        order_name: row.order_name ?? null,
        email: row.email,
        first_name: row.first_name ?? null,
        last_name: row.last_name ?? null,
        distance_label: row.distance_label ?? null,
        miles: row.miles,
        event_year: row.event_year,
        financial_status: row.financial_status,
        matched_user_id,
        matched_at: matched_user_id ? now : null,
        raw_json: row.raw,
      };
    });

    // ── Batch upsert ──────────────────────────────────────────────────────────
    const { error: upsertError } = await admin
      .from("hhh_shopify_imports")
      .upsert(records, { onConflict: "org_id,order_id" });

    if (upsertError) {
      console.error("[hhh/import]", requestId, "upsert_error", upsertError);
      await writeSystemLog("hhh:import_error", upsertError.message, { requestId });
      return {
        ok: false,
        error: `Database error: ${upsertError.message}`,
        requestId,
        inserted: 0,
        updated: 0,
        matched: 0,
        unmatched: 0,
      };
    }

    await writeSystemLog("hhh:import_run", `Import complete: ${inserted} inserted, ${updated} updated, ${matched} matched`, {
      requestId,
      by: admin_user.id,
      inserted,
      updated,
      matched,
      unmatched,
    });

    return { ok: true, requestId, inserted, updated, matched, unmatched };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[hhh/import]", requestId, "unexpected_error", err);
    await writeSystemLog("hhh:import_error", msg, { requestId });
    return { ok: false, error: "Unexpected error. Check system logs.", requestId, inserted: 0, updated: 0, matched: 0, unmatched: 0 };
  }
}

// ── Export action ─────────────────────────────────────────────────────────────

export async function getHhhImportRows(): Promise<{
  ok: boolean;
  error?: string;
  rows: ImportedRow[];
}> {
  const admin_user = await getAdminOrNull();
  if (!admin_user) return { ok: false, error: "Unauthorized", rows: [] };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("hhh_shopify_imports")
    .select(
      "id, order_id, order_name, email, first_name, last_name, distance_label, miles, event_year, financial_status, imported_at, matched_user_id"
    )
    .eq("org_id", admin_user.org_id)
    .order("event_year", { ascending: false })
    .order("imported_at", { ascending: false });

  if (error) return { ok: false, error: error.message, rows: [] };
  return { ok: true, rows: (data ?? []) as ImportedRow[] };
}
