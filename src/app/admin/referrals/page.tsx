import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReferralExportButton } from "./referral-export-button";
import { ReferralTableClient } from "./referral-table-client";

export const metadata = { title: "Referrals | Admin | MMM Event OS" };

async function exportReferralsCsv() {
  "use server";

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("referral_leaderboard_v")
    .select("*")
    .eq("org_id", org.id)
    .order("rank", { ascending: true });

  // Fetch rewards for all users
  const userIds = (entries ?? []).map((e) => e.user_id).filter((id): id is string => id !== null);
  const { data: rewards } = await admin
    .from("referral_rewards")
    .select("user_id, tier")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const rewardsByUser = new Map<string, string[]>();
  for (const r of rewards ?? []) {
    if (!r.user_id) continue;
    const existing = rewardsByUser.get(r.user_id) ?? [];
    existing.push(r.tier);
    rewardsByUser.set(r.user_id, existing);
  }

  const header = ["Rank", "Name", "Code", "Paid Referrals", "Unlocked Tiers"];

  const rows = (entries ?? []).map((e) => [
    String(e.rank),
    e.full_name ?? "",
    e.code,
    String(e.referral_count),
    (rewardsByUser.get(e.user_id ?? "") ?? []).join("; "),
  ]);

  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return csvContent;
}

export default async function AdminReferralsPage() {
  const org = await getCurrentOrg();
  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("referral_leaderboard_v")
    .select("*")
    .eq("org_id", org?.id ?? "")
    .order("rank", { ascending: true });

  // Fetch rewards for all users
  const userIds = (entries ?? []).map((e) => e.user_id).filter((id): id is string => id !== null);
  const { data: rewards } = await admin
    .from("referral_rewards")
    .select("user_id, tier")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const rewardsByUser = new Map<string, string[]>();
  for (const r of rewards ?? []) {
    if (!r.user_id) continue;
    const existing = rewardsByUser.get(r.user_id) ?? [];
    existing.push(r.tier);
    rewardsByUser.set(r.user_id, existing);
  }

  async function handleExport() {
    "use server";
    return await exportReferralsCsv();
  }

  return (
    <>
      <Hero title="Referrals" subtitle="Referral leaderboard and milestone tracking" />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Leaderboard ({entries?.length ?? 0} referrers)
          </h2>
          <ReferralExportButton action={handleExport} />
        </div>

        <Card>
          <CardHeader className="sr-only">
            <CardTitle>Referral Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {(entries?.length ?? 0) === 0 ? (
              <p className="px-6 py-12 text-center text-muted-foreground">
                No referrals yet.
              </p>
            ) : (
              <ReferralTableClient
                entries={(entries ?? []).map((entry) => ({
                  ...entry,
                  tiers: rewardsByUser.get(entry.user_id ?? "") ?? [],
                }))}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
