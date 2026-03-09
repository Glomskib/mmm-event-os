import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RaffleExportClient } from "./raffle-export-client";

export const metadata = { title: "Raffles | Admin" };

async function exportReferralPoolCsv() {
  "use server";

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("raffle_entries")
    .select("*")
    .eq("org_id", org.id)
    .eq("source", "referral")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((entries ?? []).map((e) => e.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("*").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const header = ["Participant Name", "Email", "Ticket Count", "Note", "Date"];
  const rows = (entries ?? []).map((e) => {
    const p = profileMap.get(e.user_id);
    return [
      p?.full_name ?? "",
      p?.email ?? "",
      String(e.tickets_count),
      e.note ?? "",
      new Date(e.created_at).toLocaleDateString(),
    ];
  });

  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

async function exportMainPoolCsv() {
  "use server";

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("raffle_entries")
    .select("*")
    .eq("org_id", org.id)
    .in("source", ["shop_ride", "bonus", "event"])
    .order("created_at", { ascending: false });

  const userIds = [...new Set((entries ?? []).map((e) => e.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("*").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const header = ["Participant Name", "Email", "Source", "Ticket Count", "Note", "Date"];
  const rows = (entries ?? []).map((e) => {
    const p = profileMap.get(e.user_id);
    return [
      p?.full_name ?? "",
      p?.email ?? "",
      e.source,
      String(e.tickets_count),
      e.note ?? "",
      new Date(e.created_at).toLocaleDateString(),
    ];
  });

  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

interface PoolParticipant {
  name: string;
  email: string;
  ticketCount: number;
  entryCount: number;
}

function aggregateParticipants(
  entries: { user_id: string; tickets_count: number }[],
  profileMap: Map<string, { full_name: string | null; email: string }>
): PoolParticipant[] {
  const byUser = new Map<string, { tickets: number; entries: number }>();
  for (const e of entries) {
    const existing = byUser.get(e.user_id) ?? { tickets: 0, entries: 0 };
    existing.tickets += e.tickets_count;
    existing.entries += 1;
    byUser.set(e.user_id, existing);
  }

  return [...byUser.entries()]
    .map(([userId, { tickets, entries: count }]) => {
      const p = profileMap.get(userId);
      return {
        name: p?.full_name ?? "Unknown",
        email: p?.email ?? "",
        ticketCount: tickets,
        entryCount: count,
      };
    })
    .sort((a, b) => b.ticketCount - a.ticketCount);
}

export default async function AdminRafflesPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  const admin = createAdminClient();

  // Fetch all raffle entries for this org
  const { data: allEntries } = await admin
    .from("raffle_entries")
    .select("*")
    .eq("org_id", org.id);

  const entries = allEntries ?? [];

  // Fetch profiles for all users
  const userIds = [...new Set(entries.map((e) => e.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("*").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Split into pools
  const referralEntries = entries.filter((e) => e.source === "referral");
  const mainEntries = entries.filter((e) => e.source !== "referral");

  const referralParticipants = aggregateParticipants(referralEntries, profileMap);
  const mainParticipants = aggregateParticipants(mainEntries, profileMap);

  const referralTotalTickets = referralEntries.reduce((sum, e) => sum + e.tickets_count, 0);
  const mainTotalTickets = mainEntries.reduce((sum, e) => sum + e.tickets_count, 0);

  async function handleExportReferral() {
    "use server";
    return await exportReferralPoolCsv();
  }

  async function handleExportMain() {
    "use server";
    return await exportMainPoolCsv();
  }

  return (
    <>
      <Hero title="Raffle Pools" subtitle="Manage referral and main raffle drawings" />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Tabs defaultValue="referral">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="referral">
              Referral Raffle ({referralTotalTickets})
            </TabsTrigger>
            <TabsTrigger value="main">
              Main Raffle ({mainTotalTickets})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referral" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {referralParticipants.length} participants, {referralTotalTickets} total tickets
              </p>
              <RaffleExportClient action={handleExportReferral} filename="referral-raffle" />
            </div>
            <PoolTable participants={referralParticipants} />
          </TabsContent>

          <TabsContent value="main" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {mainParticipants.length} participants, {mainTotalTickets} total tickets
              </p>
              <RaffleExportClient action={handleExportMain} filename="main-raffle" />
            </div>
            <PoolTable participants={mainParticipants} />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}

function PoolTable({ participants }: { participants: PoolParticipant[] }) {
  if (participants.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No entries in this pool yet.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Raffle Pool</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">Entries</th>
                <th className="px-4 py-3 text-right font-medium">Total Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {participants.map((p) => (
                <tr key={p.email} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.entryCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{p.ticketCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
