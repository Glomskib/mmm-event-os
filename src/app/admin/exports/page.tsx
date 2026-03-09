import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Exports | Admin" };

async function exportEmergencyContactsCsv() {
  "use server";

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const { data: registrations, error } = await admin
    .from("registrations")
    .select(
      "participant_name, participant_email, distance, status, emergency_contact_name, emergency_contact_phone, waiver_accepted_at, waiver_version, waiver_pdf_url, event_id"
    )
    .eq("org_id", org.id)
    .in("status", ["pending", "paid", "free"]);

  if (error) throw new Error("Failed to fetch registrations");

  // Fetch event titles for all unique event_ids
  const eventIds = [...new Set((registrations ?? []).map((r) => r.event_id))];
  const { data: events } = await admin
    .from("events")
    .select("id, title")
    .in("id", eventIds);

  const eventMap = new Map((events ?? []).map((e) => [e.id, e.title]));

  const header = [
    "Participant Name",
    "Participant Email",
    "Event",
    "Distance",
    "Status",
    "Emergency Contact Name",
    "Emergency Contact Phone",
    "Waiver Signed At",
    "Waiver Version",
    "Waiver PDF Path",
  ];

  const rows = (registrations ?? []).map((r) => [
    r.participant_name ?? "",
    r.participant_email ?? "",
    eventMap.get(r.event_id) ?? "",
    r.distance,
    r.status,
    r.emergency_contact_name ?? "",
    r.emergency_contact_phone ?? "",
    r.waiver_accepted_at ?? "",
    r.waiver_version ?? "",
    r.waiver_pdf_url ?? "",
  ]);

  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return csvContent;
}

export default async function ExportsPage() {
  return (
    <>
      <Hero title="Exports" subtitle="Download data for ride-day operations" />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contacts CSV</CardTitle>
              <CardDescription>
                Download participant names, emails, emergency contacts, and
                waiver status for all active registrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportButton exportFn={exportEmergencyContactsCsv} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Bundle (ZIP)</CardTitle>
              <CardDescription>
                Download a ZIP containing registrations, emergency contacts, and
                raffle entries as separate CSV files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BundleExportClient />
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

function ExportButton({
  exportFn,
}: {
  exportFn: () => Promise<string>;
}) {
  async function handleExport() {
    "use server";
    // This returns CSV content — the client component below handles download
    return await exportFn();
  }

  return <ExportButtonClient action={handleExport} />;
}

// Client-side buttons
import { ExportButtonClient } from "./export-button-client";
import { BundleExportClient } from "./bundle-export-client";
