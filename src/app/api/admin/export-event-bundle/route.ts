import { NextResponse } from "next/server";
import archiver from "archiver";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";

function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

export async function POST() {
  const org = await getCurrentOrg();
  if (!org) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  // --- Registrations CSV ---
  const { data: registrations } = await admin
    .from("registrations")
    .select(
      "participant_name, participant_email, distance, status, amount, referral_code, created_at, event_id"
    )
    .eq("org_id", org.id)
    .in("status", ["pending", "paid", "free"])
    .order("created_at", { ascending: false });

  const regs = registrations ?? [];

  const eventIds = [...new Set(regs.map((r) => r.event_id))];
  const { data: events } = eventIds.length > 0
    ? await admin.from("events").select("id, title").in("id", eventIds)
    : { data: [] };
  const eventMap = new Map((events ?? []).map((e) => [e.id, e.title]));

  const regsCsv = toCsv(
    ["Name", "Email", "Event", "Distance", "Status", "Amount", "Referral Code", "Registered At"],
    regs.map((r) => [
      r.participant_name ?? "",
      r.participant_email ?? "",
      eventMap.get(r.event_id) ?? "",
      r.distance,
      r.status,
      r.amount != null ? (r.amount / 100).toFixed(2) : "0.00",
      r.referral_code ?? "",
      r.created_at,
    ])
  );

  // --- Emergency Contacts CSV ---
  const { data: emergencyRegs } = await admin
    .from("registrations")
    .select(
      "participant_name, participant_email, distance, emergency_contact_name, emergency_contact_phone, waiver_accepted, waiver_accepted_at, event_id"
    )
    .eq("org_id", org.id)
    .in("status", ["pending", "paid", "free"]);

  const emergCsv = toCsv(
    ["Name", "Email", "Distance", "Emergency Contact", "Emergency Phone", "Waiver Signed", "Waiver Date", "Event"],
    (emergencyRegs ?? []).map((r) => [
      r.participant_name ?? "",
      r.participant_email ?? "",
      r.distance,
      r.emergency_contact_name ?? "",
      r.emergency_contact_phone ?? "",
      r.waiver_accepted ? "Yes" : "No",
      r.waiver_accepted_at ?? "",
      eventMap.get(r.event_id) ?? "",
    ])
  );

  // --- Raffle Entries CSV ---
  const { data: raffleEntries } = await admin
    .from("raffle_entries")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const raffleUserIds = [
    ...new Set((raffleEntries ?? []).map((e) => e.user_id)),
  ];
  const { data: profiles } = raffleUserIds.length > 0
    ? await admin.from("profiles").select("id, full_name, email").in("id", raffleUserIds)
    : { data: [] };
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const raffleCsv = toCsv(
    ["Name", "Email", "Source", "Tickets", "Note", "Date"],
    (raffleEntries ?? []).map((e) => {
      const p = profileMap.get(e.user_id);
      return [
        p?.full_name ?? "",
        p?.email ?? "",
        e.source,
        String(e.tickets_count),
        e.note ?? "",
        new Date(e.created_at).toLocaleDateString(),
      ];
    })
  );

  // --- Build ZIP ---
  const chunks: Buffer[] = [];
  const archive = archiver("zip", { zlib: { level: 9 } });

  const collectPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  archive.append(regsCsv, { name: "registrations.csv" });
  archive.append(emergCsv, { name: "emergency_contacts.csv" });
  archive.append(raffleCsv, { name: "raffle_entries.csv" });
  await archive.finalize();

  const zipBuffer = await collectPromise;
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="event-bundle-${date}.zip"`,
    },
  });
}
