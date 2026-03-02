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
import { Badge } from "@/components/ui/badge";
import { RevenueBreakdownCard } from "./analytics-tables-client";

export const metadata = { title: "Analytics | Admin | MMM Event OS" };

export default async function AnalyticsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  const admin = createAdminClient();

  // Fetch all registrations for this org
  const { data: registrations } = await admin
    .from("registrations")
    .select("id, status, amount, distance, event_id, referral_code, created_at")
    .eq("org_id", org.id);

  const regs = registrations ?? [];

  // Fetch events for name mapping
  const eventIds = [...new Set(regs.map((r) => r.event_id))];
  const { data: events } = eventIds.length > 0
    ? await admin.from("events").select("id, title").in("id", eventIds)
    : { data: [] };
  const eventMap = new Map((events ?? []).map((e) => [e.id, e.title]));

  // Fetch referral credits to calculate referral-generated revenue
  const { data: referralCredits } = await admin
    .from("referral_credits")
    .select("registration_id")
    .eq("org_id", org.id)
    .eq("voided", false);

  const referralRegIds = new Set(
    (referralCredits ?? []).map((rc) => rc.registration_id)
  );

  // --- Compute metrics ---
  const paid = regs.filter((r) => r.status === "paid");
  const free = regs.filter((r) => r.status === "free");
  const refunded = regs.filter((r) => r.status === "refunded");

  const totalRevenue = paid.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const refundCount = refunded.length;

  // Revenue by event
  const revenueByEvent = new Map<string, number>();
  for (const r of paid) {
    const name = eventMap.get(r.event_id) ?? "Unknown";
    revenueByEvent.set(name, (revenueByEvent.get(name) ?? 0) + (r.amount ?? 0));
  }

  // Revenue by distance
  const revenueByDistance = new Map<string, number>();
  for (const r of paid) {
    revenueByDistance.set(
      r.distance,
      (revenueByDistance.get(r.distance) ?? 0) + (r.amount ?? 0)
    );
  }

  // Referral-generated revenue (paid regs that have a referral credit)
  const referralRevenue = paid
    .filter((r) => referralRegIds.has(r.id))
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  // Time-based registration counts
  const now = Date.now();
  const daysAgo = (days: number) => now - days * 86_400_000;
  const regsLast7 = regs.filter(
    (r) => new Date(r.created_at).getTime() > daysAgo(7)
  ).length;
  const regsLast14 = regs.filter(
    (r) => new Date(r.created_at).getTime() > daysAgo(14)
  ).length;
  const regsLast30 = regs.filter(
    (r) => new Date(r.created_at).getTime() > daysAgo(30)
  ).length;

  // Conversion: free → paid (users who had a free reg and later paid)
  const freeEmails = new Set(
    regs.filter((r) => r.status === "free").map((r) => r.referral_code)
  );
  // Actually track by referral_code usage: people who registered free and also paid
  // Better approach: group by user behavior
  const conversionPct =
    free.length > 0
      ? ((paid.length / (paid.length + free.length)) * 100).toFixed(1)
      : "N/A";

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Hero title="Analytics" subtitle="Registration and revenue metrics" />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* --- Top-level summary --- */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Registrations"
            value={String(regs.length)}
            detail={`${paid.length} paid · ${free.length} free · ${refunded.length} refunded`}
          />
          <MetricCard
            title="Total Revenue"
            value={fmt(totalRevenue)}
            detail={`${paid.length} paid registrations`}
          />
          <MetricCard
            title="Refunds"
            value={String(refundCount)}
            detail="Refunded registrations"
          />
          <MetricCard
            title="Referral Revenue"
            value={fmt(referralRevenue)}
            detail={`${referralRegIds.size} referral-linked registrations`}
          />
        </div>

        {/* --- Trend cards --- */}
        <div className="grid gap-6 sm:grid-cols-3">
          <MetricCard title="Last 7 Days" value={String(regsLast7)} detail="New registrations" />
          <MetricCard title="Last 14 Days" value={String(regsLast14)} detail="New registrations" />
          <MetricCard title="Last 30 Days" value={String(regsLast30)} detail="New registrations" />
        </div>

        {/* --- Conversion --- */}
        <div className="grid gap-6 sm:grid-cols-2">
          <MetricCard
            title="Conversion (Free → Paid)"
            value={conversionPct === "N/A" ? conversionPct : `${conversionPct}%`}
            detail={`${paid.length} paid out of ${paid.length + free.length} total (excl. refunded)`}
          />
        </div>

        {/* --- Revenue by Event --- */}
        <RevenueBreakdownCard
          title="Revenue by Event"
          items={[...revenueByEvent.entries()].map(([label, cents]) => ({
            label,
            cents,
          }))}
          csvFilename="revenue-by-event"
        />

        {/* --- Revenue by Distance --- */}
        <RevenueBreakdownCard
          title="Revenue by Distance"
          items={[...revenueByDistance.entries()].map(([label, cents]) => ({
            label,
            cents,
          }))}
          csvFilename="revenue-by-distance"
        />
      </section>
    </>
  );
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
