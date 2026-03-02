"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";
import { getCurrentOrg } from "@/lib/org";
import type { Json } from "@/lib/database.types";

type SponsorStatus =
  | "prospect"
  | "contacted"
  | "negotiating"
  | "committed"
  | "paid"
  | "declined";

type InteractionType = "email" | "call" | "meeting" | "text";

// ─── Sponsors ────────────────────────────────────────────────────────────────

export async function addSponsor(input: {
  orgId: string;
  name: string;
  website?: string;
  address?: string;
  status?: SponsorStatus;
  expectedAmount?: number;
  notes?: string;
  nextFollowupAt?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { data, error } = await db
    .from("sponsors")
    .insert({
      org_id: input.orgId,
      name: input.name,
      website: input.website || null,
      address: input.address || null,
      status: input.status ?? "prospect",
      expected_amount: input.expectedAmount ?? 0,
      notes: input.notes || null,
      next_followup_at: input.nextFollowupAt || null,
      owner_profile_id: admin.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function updateSponsor(
  sponsorId: string,
  updates: {
    name?: string;
    website?: string;
    address?: string;
    status?: SponsorStatus;
    expectedAmount?: number;
    committedAmount?: number;
    notes?: string;
    nextFollowupAt?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();

  const updateObj: Record<string, unknown> = {};
  if (updates.name !== undefined) updateObj.name = updates.name;
  if (updates.website !== undefined) updateObj.website = updates.website || null;
  if (updates.address !== undefined) updateObj.address = updates.address || null;
  if (updates.status !== undefined) updateObj.status = updates.status;
  if (updates.expectedAmount !== undefined)
    updateObj.expected_amount = updates.expectedAmount;
  if (updates.committedAmount !== undefined)
    updateObj.committed_amount = updates.committedAmount;
  if (updates.notes !== undefined) updateObj.notes = updates.notes || null;
  if (updates.nextFollowupAt !== undefined)
    updateObj.next_followup_at = updates.nextFollowupAt;

  const { error } = await db
    .from("sponsors")
    .update(updateObj)
    .eq("id", sponsorId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteSponsor(
  sponsorId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("sponsors").delete().eq("id", sponsorId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function addContact(input: {
  sponsorId: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("sponsor_contacts").insert({
    sponsor_id: input.sponsorId,
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    role: input.role || null,
    notes: input.notes || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteContact(
  contactId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db
    .from("sponsor_contacts")
    .delete()
    .eq("id", contactId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Interactions ────────────────────────────────────────────────────────────

export async function logInteraction(input: {
  sponsorId: string;
  type: InteractionType;
  summary: string;
  occurredAt?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const db = createAdminClient();
  const { error } = await db.from("sponsor_interactions").insert({
    sponsor_id: input.sponsorId,
    type: input.type,
    summary: input.summary,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Email Draft ─────────────────────────────────────────────────────────────

export async function generateEmailDraft(input: {
  sponsorId: string;
  sponsorName: string;
  contactName: string;
  contactEmail: string;
}): Promise<{ ok: boolean; approvalId?: string; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Org not found" };

  const db = createAdminClient();

  const bodyJson: Record<string, unknown> = {
    content: [
      `Hi ${input.contactName},`,
      "",
      `I'm reaching out on behalf of Making Miles Matter regarding a potential sponsorship opportunity for our upcoming events.`,
      "",
      `We'd love to discuss how ${input.sponsorName} could partner with us. Our events bring together hundreds of riders for cycling, community, and charitable causes.`,
      "",
      "Would you be available for a quick call this week?",
      "",
      "Best regards,",
      admin.full_name || "MMM Team",
    ].join("\n"),
    sponsorId: input.sponsorId,
    contactEmail: input.contactEmail,
  };

  const { data, error } = await db
    .from("approvals")
    .insert({
      org_id: org.id,
      type: "email_draft",
      status: "draft",
      title: `Sponsor Outreach: ${input.sponsorName}`,
      body_json: bodyJson as Json,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, approvalId: data.id };
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export async function exportSponsorsCsv(): Promise<string> {
  const admin = await getAdminOrNull();
  if (!admin) throw new Error("Unauthorized");

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const db = createAdminClient();

  const { data: sponsors } = await db
    .from("sponsors")
    .select("*")
    .eq("org_id", org.id)
    .order("name");

  const { data: contacts } = await db
    .from("sponsor_contacts")
    .select("*")
    .in(
      "sponsor_id",
      (sponsors ?? []).map((s) => s.id)
    );

  const contactsBySponsor = new Map<
    string,
    { name: string; email: string | null; role: string | null }[]
  >();
  for (const c of contacts ?? []) {
    const list = contactsBySponsor.get(c.sponsor_id) ?? [];
    list.push({ name: c.name, email: c.email, role: c.role });
    contactsBySponsor.set(c.sponsor_id, list);
  }

  const header = [
    "Name",
    "Status",
    "Expected $",
    "Committed $",
    "Website",
    "Address",
    "Primary Contact",
    "Contact Email",
    "Next Follow-up",
    "Notes",
  ];

  const rows = (sponsors ?? []).map((s) => {
    const primaryContact = (contactsBySponsor.get(s.id) ?? [])[0];
    return [
      s.name,
      s.status,
      String(s.expected_amount ?? 0),
      String(s.committed_amount ?? 0),
      s.website ?? "",
      s.address ?? "",
      primaryContact?.name ?? "",
      primaryContact?.email ?? "",
      s.next_followup_at
        ? new Date(s.next_followup_at).toLocaleDateString()
        : "",
      s.notes ?? "",
    ];
  });

  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}
