import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModerationClient } from "./moderation-client";
import { ExportRaffleClient } from "./export-raffle-client";

export const metadata = { title: "Check-ins | Admin | MMM Event OS" };

async function approveCheckin(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing checkin id");

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  // Get the checkin to find user_id
  const { data: checkin, error: fetchError } = await admin
    .from("checkins")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (fetchError || !checkin) throw new Error("Checkin not found");
  if (checkin.approved) return; // already approved

  // Update checkin to approved
  const { error: updateError } = await admin
    .from("checkins")
    .update({ approved: true })
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  // Create raffle entry
  const { error: raffleError } = await admin
    .from("raffle_entries")
    .insert({
      org_id: checkin.org_id,
      user_id: checkin.user_id,
      source: "shop_ride",
      checkin_id: id,
      tickets_count: 1,
      note: "Approved shop ride check-in",
    });

  if (raffleError && raffleError.code !== "23505") {
    throw new Error(raffleError.message);
  }
}

async function rejectCheckin(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing checkin id");

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  // Get checkin for photo path
  const { data: checkin } = await admin
    .from("checkins")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  // Delete the storage file if it exists
  if (checkin?.photo_path) {
    await admin.storage.from("checkins").remove([checkin.photo_path]);
  }

  // Delete the checkin
  const { error } = await admin
    .from("checkins")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);
}

async function bulkApprove(formData: FormData) {
  "use server";

  const idsJson = formData.get("ids") as string;
  if (!idsJson) throw new Error("Missing ids");

  const ids: string[] = JSON.parse(idsJson);
  if (ids.length === 0) return;

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  // Fetch all checkins to approve
  const { data: checkins } = await admin
    .from("checkins")
    .select("*")
    .in("id", ids)
    .eq("org_id", org.id)
    .eq("approved", false);

  if (!checkins || checkins.length === 0) return;

  // Update all to approved
  await admin
    .from("checkins")
    .update({ approved: true })
    .in("id", checkins.map((c) => c.id));

  // Insert raffle entries for each
  const entries = checkins.map((c) => ({
    org_id: c.org_id,
    user_id: c.user_id,
    source: "shop_ride" as const,
    checkin_id: c.id,
    tickets_count: 1,
    note: "Approved shop ride check-in (bulk)",
  }));

  // Insert one at a time to handle unique constraint gracefully
  for (const entry of entries) {
    await admin.from("raffle_entries").insert(entry);
  }
}

async function exportRaffleCsv() {
  "use server";

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("raffle_entries")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  // Fetch profile info for all users
  const userIds = [...new Set((entries ?? []).map((e) => e.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const header = ["User Name", "Email", "Source", "Note", "Date"];
  const rows = (entries ?? []).map((e) => {
    const profile = profileMap.get(e.user_id);
    return [
      profile?.full_name ?? "",
      profile?.email ?? "",
      e.source,
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

export default async function AdminCheckinsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  const admin = createAdminClient();

  // Fetch all checkins for this org
  const { data: allCheckins } = await admin
    .from("checkins")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const checkinsList = allCheckins ?? [];

  // Fetch profiles for all user_ids
  const userIds = [...new Set(checkinsList.map((c) => c.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("*").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Fetch ride occurrences with series titles
  const rideOccIds = [...new Set(checkinsList.map((c) => c.ride_occurrence_id).filter(Boolean))] as string[];
  const { data: rideOccs } = rideOccIds.length > 0
    ? await admin.from("ride_occurrences").select("*, ride_series(title)").in("id", rideOccIds)
    : { data: [] };
  const rideMap = new Map((rideOccs ?? []).map((r) => [r.id, r]));

  // Generate signed URLs for photos
  async function getSignedUrl(path: string | null) {
    if (!path) return null;
    const { data } = await admin.storage
      .from("checkins")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  async function enrichCheckin(c: (typeof checkinsList)[number]) {
    const profile = profileMap.get(c.user_id);
    const ride = c.ride_occurrence_id ? rideMap.get(c.ride_occurrence_id) : null;
    return {
      id: c.id,
      photoUrl: await getSignedUrl(c.photo_path),
      userName: profile?.full_name ?? "Unknown",
      userEmail: profile?.email ?? "",
      rideName: ride?.ride_series?.title ?? "Ride",
      rideDate: ride?.date ?? "",
    };
  }

  const pendingWithUrls = await Promise.all(
    checkinsList.filter((c) => !c.approved).map(enrichCheckin)
  );

  const approvedWithUrls = await Promise.all(
    checkinsList.filter((c) => c.approved).map(enrichCheckin)
  );

  return (
    <>
      <Hero title="Check-in Moderation" subtitle="Review rider photos and approve raffle entries" />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div />
          <ExportRaffleClient action={exportRaffleCsv} />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">
              Pending ({pendingWithUrls.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedWithUrls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <ModerationClient
              checkins={pendingWithUrls}
              approveAction={approveCheckin}
              rejectAction={rejectCheckin}
              bulkApproveAction={bulkApprove}
              mode="pending"
            />
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <ModerationClient
              checkins={approvedWithUrls}
              approveAction={approveCheckin}
              rejectAction={rejectCheckin}
              bulkApproveAction={bulkApprove}
              mode="approved"
            />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
