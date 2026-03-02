/**
 * Early incentives engine.
 *
 * Applies early-bird bonus raffle tickets and merch perks to a registration
 * if the registration was created before the event's deadline.
 *
 * Idempotent: safe to call multiple times (e.g. webhook retries).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/event-slug";
import { writeSystemLog } from "@/lib/logger";

interface EarlyBonusConfig {
  /** UTC deadline — registrations created strictly before this qualify */
  deadlineUtc: string;
  /** Total MAIN raffle tickets the participant should have after applying bonus */
  mainTicketsTarget: number;
  /** Optional merch perk key to add to registrations.early_merch_perk */
  merchPerk?: string;
}

// FFF: Apr 1 2026 23:59:59 ET (EST = UTC-5) → 2026-04-02T04:59:59Z
// HHH: May 31 2026 23:59:59 ET (EDT = UTC-4) → 2026-06-01T03:59:59Z
const EARLY_BONUS_CONFIGS: Record<string, EarlyBonusConfig> = {
  "findlay-further-fondo": {
    deadlineUtc: "2026-04-02T04:59:59Z",
    mainTicketsTarget: 1,
  },
  "hancock-horizontal-hundred-2026": {
    deadlineUtc: "2026-06-01T03:59:59Z",
    mainTicketsTarget: 5,
    merchPerk: "hhh_socks_2026",
  },
};

// raffle_entry sources that count toward the "main" pool
const MAIN_SOURCES = new Set(["shop_ride", "bonus", "event", "early_bonus"]);

/**
 * Apply early-bird bonus for a given registration.
 * No-op if the event has no early-bonus config or the deadline has passed.
 * Safe to call multiple times.
 */
export async function applyEarlyBonusForRegistration(
  registrationId: string
): Promise<void> {
  const admin = createAdminClient();

  // Load registration + event title
  const { data: reg, error: regErr } = await admin
    .from("registrations")
    .select("id, org_id, user_id, event_id, created_at")
    .eq("id", registrationId)
    .single();

  if (regErr || !reg) {
    console.error("[incentives] registration not found:", registrationId, regErr);
    return;
  }

  const { data: evt, error: evtErr } = await admin
    .from("events")
    .select("title, slug")
    .eq("id", reg.event_id)
    .single();

  if (evtErr || !evt) {
    console.error("[incentives] event not found for registration:", registrationId, evtErr);
    return;
  }

  const eventSlug = (evt as { slug?: string | null }).slug ?? slugify(evt.title);
  const config = EARLY_BONUS_CONFIGS[eventSlug];

  if (!config) return; // no early bonus for this event

  // Check deadline
  const registeredAt = new Date(reg.created_at);
  const deadline = new Date(config.deadlineUtc);

  if (registeredAt >= deadline) return; // past deadline — no bonus

  // Count existing MAIN raffle tickets for this registration's user
  const { data: existingEntries, error: ticketErr } = await admin
    .from("raffle_entries")
    .select("source, tickets_count")
    .eq("org_id", reg.org_id)
    .eq("user_id", reg.user_id ?? "");

  if (ticketErr) {
    console.error("[incentives] failed to fetch raffle entries:", ticketErr);
    return;
  }

  const existingMain = (existingEntries ?? [])
    .filter((e) => MAIN_SOURCES.has(e.source))
    .reduce((sum, e) => sum + (e.tickets_count ?? 1), 0);

  const delta = Math.max(0, config.mainTicketsTarget - existingMain);

  if (delta > 0) {
    const sourceId = `early_bonus:${registrationId}`;

    const { error: insertErr } = await admin.from("raffle_entries").insert({
      org_id: reg.org_id,
      user_id: reg.user_id ?? "",
      source: "early_bonus" as const,
      source_id: sourceId,
      tickets_count: delta,
      note: `early bonus — ${eventSlug} (target ${config.mainTicketsTarget})`,
    });

    // Ignore unique-constraint violation (idempotent)
    if (insertErr && !insertErr.message.includes("duplicate")) {
      console.error("[incentives] failed to insert early_bonus entry:", insertErr);
      return;
    }
  }

  // Merch perk — idempotent array append
  if (config.merchPerk) {
    // Only update if perk not already present (array contains check)
    const { data: currentReg } = await admin
      .from("registrations")
      .select("early_merch_perk")
      .eq("id", registrationId)
      .single();

    const existingPerks: string[] = (currentReg?.early_merch_perk as string[]) ?? [];

    if (!existingPerks.includes(config.merchPerk)) {
      await admin
        .from("registrations")
        .update({
          early_merch_perk: [...existingPerks, config.merchPerk],
        })
        .eq("id", registrationId);
    }
  }

  // Log
  await writeSystemLog("incentive:early_bonus_applied", `Early bonus applied for ${registrationId}`, {
    registrationId,
    eventSlug,
    delta,
    perk: config.merchPerk ?? null,
  });
}
