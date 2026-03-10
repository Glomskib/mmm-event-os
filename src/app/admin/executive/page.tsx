import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Handshake,
  Heart,
  Calendar,
  Target,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Executive Dashboard | Admin" };
export const revalidate = 60;

export default async function ExecutiveDashboardPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [
    { data: events },
    { data: registrations },
    { data: donations },
    { data: sponsors },
    { data: volunteers },
    { data: financials },
    { data: notes },
    { data: attribution },
  ] = await Promise.all([
    db
      .from("events")
      .select("id, title, date, status, fundraising_goal, rider_goal, sponsor_goal, volunteer_goal, capacity")
      .eq("org_id", org.id)
      .order("date", { ascending: true }),
    db
      .from("registrations")
      .select("id, event_id, status, amount, created_at, referral_code")
      .eq("org_id", org.id),
    db
      .from("donations")
      .select("id, amount, net_amount, donor_name, anonymous, event_id, recurring, source, created_at")
      .eq("org_id", org.id),
    db
      .from("sponsors")
      .select("id, name, status, committed_amount, expected_amount, in_kind_value, tier, event_id, renewal_likelihood, created_at")
      .eq("org_id", org.id),
    db
      .from("volunteer_signups")
      .select("id, total_hours, created_at")
      .order("created_at", { ascending: false }),
    db
      .from("financial_summary")
      .select("*")
      .eq("org_id", org.id),
    db
      .from("executive_notes")
      .select("id, title, body, category, pinned, author_id, created_at")
      .eq("org_id", org.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("attribution_events")
      .select("source, entity_type, created_at")
      .eq("org_id", org.id),
  ]);

  const allEvents = (events ?? []) as Array<{
    id: string; title: string; date: string; status: string;
    fundraising_goal: number | null; rider_goal: number | null;
    sponsor_goal: number | null; volunteer_goal: number | null; capacity: number | null;
  }>;
  const allRegs = (registrations ?? []) as Array<{
    id: string; event_id: string; status: string; amount: number;
    created_at: string; referral_code: string | null;
  }>;
  const allDonations = (donations ?? []) as Array<{
    id: string; amount: number; net_amount: number | null; donor_name: string | null;
    anonymous: boolean; event_id: string | null; recurring: boolean; source: string; created_at: string;
  }>;
  const allSponsors = (sponsors ?? []) as Array<{
    id: string; name: string; status: string; committed_amount: number | null;
    expected_amount: number | null; in_kind_value: number | null; tier: string;
    event_id: string | null; renewal_likelihood: string | null; created_at: string;
  }>;
  const allVolunteers = (volunteers ?? []) as Array<{
    id: string; total_hours: number | null; created_at: string;
  }>;
  const allFinancials = (financials ?? []) as Array<{
    id: string; event_id: string | null; period: string | null;
    gross_registration_revenue: number; net_registration_revenue: number;
    sponsor_revenue: number; donation_revenue: number; merch_revenue: number;
    in_kind_value: number; total_expenses: number; notes: string | null;
  }>;
  const allNotes = (notes ?? []) as Array<{
    id: string; title: string; body: string | null; category: string;
    pinned: boolean; author_id: string | null; created_at: string;
  }>;
  const allAttribution = (attribution ?? []) as Array<{
    source: string; entity_type: string; created_at: string;
  }>;

  const eventMap = new Map(allEvents.map((e) => [e.id, e.title]));

  // ── Revenue calculations ───────────────────────────────────
  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const paidRegs = allRegs.filter((r) => r.status === "paid");
  const grossRegRevenue = paidRegs.reduce((s, r) => s + (r.amount ?? 0), 0);
  const donationRevenue = allDonations.reduce((s, d) => s + (d.amount ?? 0), 0);
  const sponsorRevenue = allSponsors
    .filter((s) => s.status === "committed" || s.status === "paid")
    .reduce((s, sp) => s + (sp.committed_amount ?? 0) * 100, 0); // sponsors in dollars, convert to cents
  const inKindValue = allSponsors.reduce((s, sp) => s + (sp.in_kind_value ?? 0) * 100, 0);
  const totalRevenue = grossRegRevenue + donationRevenue + sponsorRevenue;

  // Pipeline (prospects + contacted + negotiating)
  const pipelineSponsors = allSponsors.filter((s) =>
    ["prospect", "contacted", "negotiating"].includes(s.status)
  );
  const pipelineWeightedValue = pipelineSponsors.reduce((s, sp) => {
    const weight = sp.status === "negotiating" ? 0.7 : sp.status === "contacted" ? 0.3 : 0.1;
    return s + (sp.expected_amount ?? 0) * weight;
  }, 0);

  // Retention: sponsors who paid/committed this year
  const committedCount = allSponsors.filter((s) => s.status === "committed" || s.status === "paid").length;
  const renewalHighCount = allSponsors.filter((s) => s.renewal_likelihood === "high").length;

  // Rider growth: registrations by month (last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyRegs: { month: string; count: number; revenue: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthStr = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const monthRegs = allRegs.filter((r) => {
      const rd = new Date(r.created_at);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
    });
    monthlyRegs.push({
      month: monthStr,
      count: monthRegs.length,
      revenue: monthRegs.filter((r) => r.status === "paid").reduce((s, r) => s + (r.amount ?? 0), 0),
    });
  }

  // Revenue per rider
  const revenuePerRider = paidRegs.length > 0 ? Math.round(grossRegRevenue / paidRegs.length) : 0;

  // Donation sources
  const donationBySource = new Map<string, number>();
  for (const d of allDonations) {
    const src = d.source || "website";
    donationBySource.set(src, (donationBySource.get(src) ?? 0) + d.amount);
  }

  // Attribution by source
  const attrBySource = new Map<string, number>();
  for (const a of allAttribution) {
    attrBySource.set(a.source, (attrBySource.get(a.source) ?? 0) + 1);
  }

  // Volunteer hours
  const totalVolunteerHours = allVolunteers.reduce((s, v) => s + (v.total_hours ?? 0), 0);

  // Total expenses from financial summaries
  const totalExpenses = allFinancials.reduce((s, f) => s + (f.total_expenses ?? 0), 0);
  const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : "N/A";

  // Event P&L
  const eventPnL = allEvents
    .filter((e) => e.status === "published")
    .map((e) => {
      const eRegs = paidRegs.filter((r) => r.event_id === e.id);
      const eDonations = allDonations.filter((d) => d.event_id === e.id);
      const eSponsors = allSponsors.filter((s) => s.event_id === e.id && (s.status === "committed" || s.status === "paid"));
      const eFinancial = allFinancials.find((f) => f.event_id === e.id);
      const regRev = eRegs.reduce((s, r) => s + (r.amount ?? 0), 0);
      const donRev = eDonations.reduce((s, d) => s + (d.amount ?? 0), 0);
      const spoRev = eSponsors.reduce((s, sp) => s + (sp.committed_amount ?? 0) * 100, 0);
      const expenses = eFinancial?.total_expenses ?? 0;
      return {
        title: e.title,
        date: e.date,
        riders: eRegs.length,
        riderGoal: e.rider_goal,
        regRevenue: regRev,
        donRevenue: donRev,
        spoRevenue: spoRev,
        totalRevenue: regRev + donRev + spoRev,
        expenses,
        margin: regRev + donRev + spoRev - expenses,
        fundraisingGoal: e.fundraising_goal,
      };
    });

  // Risks/blockers
  const risks: string[] = [];
  const upcomingEvents = allEvents.filter((e) => new Date(e.date) >= new Date() && e.status === "published");
  for (const e of upcomingEvents) {
    const eRegs = allRegs.filter((r) => r.event_id === e.id && (r.status === "paid" || r.status === "free"));
    if (e.rider_goal && eRegs.length < e.rider_goal * 0.5) {
      risks.push(`${e.title}: Only ${eRegs.length}/${e.rider_goal} riders registered`);
    }
    const eSponsors = allSponsors.filter((s) => s.event_id === e.id && (s.status === "committed" || s.status === "paid"));
    if (e.sponsor_goal && eSponsors.length < e.sponsor_goal * 0.5) {
      risks.push(`${e.title}: Only ${eSponsors.length}/${e.sponsor_goal} sponsors secured`);
    }
  }

  return (
    <>
      <Hero
        title="Executive Dashboard"
        subtitle="Revenue, growth, pipeline, and mission impact"
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mb-2 gap-1">
            <ArrowLeft className="h-4 w-4" /> Admin Home
          </Button>
        </Link>

        {/* ── Top KPIs ────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard icon={DollarSign} label="Total Revenue (YTD)" value={fmt(totalRevenue)} color="text-green-600" />
          <KPICard icon={Users} label="Total Riders" value={String(paidRegs.length)} color="text-blue-600" />
          <KPICard icon={Handshake} label="Sponsors Secured" value={String(committedCount)} color="text-sky-600" />
          <KPICard icon={Heart} label="Donations" value={fmt(donationRevenue)} color="text-red-500" />
        </div>

        {/* ── Revenue Breakdown ───────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <RevenueLine label="Registration Revenue" value={fmt(grossRegRevenue)} />
              <RevenueLine label="Sponsor Revenue" value={fmt(sponsorRevenue)} />
              <RevenueLine label="Donation Revenue" value={fmt(donationRevenue)} />
              <RevenueLine label="In-Kind Value" value={fmt(inKindValue)} />
              <RevenueLine label="Revenue / Rider" value={fmt(revenuePerRider)} />
            </div>
            {totalExpenses > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3 border-t pt-4">
                <RevenueLine label="Total Expenses" value={fmt(totalExpenses)} />
                <RevenueLine label="Net Margin" value={margin === "N/A" ? margin : `${margin}%`} />
                <RevenueLine label="Net Revenue" value={fmt(totalRevenue - totalExpenses)} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Sponsorship Pipeline ──────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Handshake className="h-5 w-5 text-sky-600" />
                Sponsorship Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <PipelineRow
                  stage="Prospect"
                  count={allSponsors.filter((s) => s.status === "prospect").length}
                  value={allSponsors.filter((s) => s.status === "prospect").reduce((sum, s) => sum + (s.expected_amount ?? 0), 0)}
                />
                <PipelineRow
                  stage="Contacted"
                  count={allSponsors.filter((s) => s.status === "contacted").length}
                  value={allSponsors.filter((s) => s.status === "contacted").reduce((sum, s) => sum + (s.expected_amount ?? 0), 0)}
                />
                <PipelineRow
                  stage="Negotiating"
                  count={allSponsors.filter((s) => s.status === "negotiating").length}
                  value={allSponsors.filter((s) => s.status === "negotiating").reduce((sum, s) => sum + (s.expected_amount ?? 0), 0)}
                />
                <PipelineRow
                  stage="Committed"
                  count={allSponsors.filter((s) => s.status === "committed").length}
                  value={allSponsors.filter((s) => s.status === "committed").reduce((sum, s) => sum + (s.committed_amount ?? 0), 0)}
                />
                <PipelineRow
                  stage="Paid"
                  count={allSponsors.filter((s) => s.status === "paid").length}
                  value={allSponsors.filter((s) => s.status === "paid").reduce((sum, s) => sum + (s.committed_amount ?? 0), 0)}
                />
                <PipelineRow
                  stage="Declined"
                  count={allSponsors.filter((s) => s.status === "declined").length}
                  value={0}
                />
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Weighted Pipeline Value</span>
                    <span className="font-bold">${pipelineWeightedValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Renewal Likelihood (High)</span>
                    <span>{renewalHighCount} sponsors</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Rider Growth ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Rider Growth (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthlyRegs.map((m) => (
                  <div key={m.month} className="flex items-center justify-between text-sm">
                    <span className="w-20 font-medium">{m.month}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${Math.min(100, (m.count / Math.max(1, Math.max(...monthlyRegs.map((x) => x.count)))) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right tabular-nums">
                      {m.count} reg{m.count !== 1 ? "s" : ""}
                    </span>
                    <span className="w-20 text-right tabular-nums text-muted-foreground">
                      {fmt(m.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Event P&L Table ─────────────────────────────────── */}
        {eventPnL.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Event P&L Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4">Event</th>
                      <th className="pb-2 pr-4 text-right">Riders</th>
                      <th className="pb-2 pr-4 text-right">Reg Rev</th>
                      <th className="pb-2 pr-4 text-right">Sponsor Rev</th>
                      <th className="pb-2 pr-4 text-right">Donation Rev</th>
                      <th className="pb-2 pr-4 text-right">Total Rev</th>
                      <th className="pb-2 pr-4 text-right">Expenses</th>
                      <th className="pb-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {eventPnL.map((e) => (
                      <tr key={e.title}>
                        <td className="py-2 pr-4 font-medium">
                          {e.title}
                          <span className="block text-xs text-muted-foreground">
                            {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {e.riders}{e.riderGoal ? ` / ${e.riderGoal}` : ""}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{fmt(e.regRevenue)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{fmt(e.spoRevenue)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{fmt(e.donRevenue)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums font-semibold">{fmt(e.totalRevenue)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{fmt(e.expenses)}</td>
                        <td className={`py-2 text-right tabular-nums font-semibold ${e.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {fmt(e.margin)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td className="py-2 pr-4">Total</td>
                      <td className="py-2 pr-4 text-right">{eventPnL.reduce((s, e) => s + e.riders, 0)}</td>
                      <td className="py-2 pr-4 text-right">{fmt(eventPnL.reduce((s, e) => s + e.regRevenue, 0))}</td>
                      <td className="py-2 pr-4 text-right">{fmt(eventPnL.reduce((s, e) => s + e.spoRevenue, 0))}</td>
                      <td className="py-2 pr-4 text-right">{fmt(eventPnL.reduce((s, e) => s + e.donRevenue, 0))}</td>
                      <td className="py-2 pr-4 text-right">{fmt(eventPnL.reduce((s, e) => s + e.totalRevenue, 0))}</td>
                      <td className="py-2 pr-4 text-right">{fmt(eventPnL.reduce((s, e) => s + e.expenses, 0))}</td>
                      <td className="py-2 text-right">{fmt(eventPnL.reduce((s, e) => s + e.margin, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Goal Tracking ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-600" />
                Goal Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((e) => {
                  const eRegs = allRegs.filter((r) => r.event_id === e.id && (r.status === "paid" || r.status === "free"));
                  return (
                    <div key={e.id} className="space-y-2">
                      <p className="text-sm font-semibold">{e.title}</p>
                      {e.rider_goal && e.rider_goal > 0 && (
                        <GoalBar label="Riders" current={eRegs.length} goal={e.rider_goal} />
                      )}
                      {e.fundraising_goal && e.fundraising_goal > 0 && (
                        <GoalBar
                          label="Fundraising"
                          current={Math.round(
                            (paidRegs.filter((r) => r.event_id === e.id).reduce((s, r) => s + (r.amount ?? 0), 0) +
                              allDonations.filter((d) => d.event_id === e.id).reduce((s, d) => s + (d.amount ?? 0), 0)) / 100
                          )}
                          goal={e.fundraising_goal}
                          prefix="$"
                        />
                      )}
                    </div>
                  );
                })}
                {upcomingEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No upcoming events with goals set.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Mission Impact ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Mission Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <ImpactStat label="Total Participants" value={String(allRegs.filter((r) => r.status === "paid" || r.status === "free").length)} />
                <ImpactStat label="Volunteer Hours" value={totalVolunteerHours > 0 ? totalVolunteerHours.toFixed(0) : "—"} />
                <ImpactStat label="Funds Raised" value={fmt(totalRevenue)} />
                <ImpactStat label="Sponsors Engaged" value={String(allSponsors.length)} />
                <ImpactStat label="Volunteers Recruited" value={String(allVolunteers.length)} />
                <ImpactStat label="Events This Season" value={String(allEvents.filter((e) => e.status === "published").length)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Risks & Blockers ────────────────────────────────── */}
        {risks.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Risks & Blockers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {risks.map((risk, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ── Attribution ─────────────────────────────────────── */}
        {attrBySource.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acquisition Attribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[...attrBySource.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span className="font-medium capitalize">{source}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Executive Notes ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Executive Notes</CardTitle>
            <CardDescription>Strategic notes, observations, and decisions</CardDescription>
          </CardHeader>
          <CardContent>
            {allNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No executive notes yet. Add notes via the database or the notes API.
              </p>
            ) : (
              <div className="space-y-3">
                {allNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {note.pinned && <Badge variant="default">Pinned</Badge>}
                      <Badge variant="secondary">{note.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{note.title}</p>
                    {note.body && <p className="text-sm text-muted-foreground mt-1">{note.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Quick Links ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/analytics"><Button size="sm">Detailed Analytics</Button></Link>
              <Link href="/admin/sponsors"><Button size="sm" variant="outline">Sponsor CRM</Button></Link>
              <Link href="/admin/donations"><Button size="sm" variant="outline">Donation Log</Button></Link>
              <Link href="/admin/financial"><Button size="sm" variant="outline">Financial Summaries</Button></Link>
              <Link href="/admin/coordinator"><Button size="sm" variant="outline">Coordinator View</Button></Link>
              <Link href="/admin/exports"><Button size="sm" variant="outline">Export Data</Button></Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function KPICard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function PipelineRow({ stage, count, value }: { stage: string; count: number; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="w-28">{stage}</span>
      <Badge variant="secondary">{count}</Badge>
      <span className="w-24 text-right tabular-nums font-medium">
        ${value.toLocaleString()}
      </span>
    </div>
  );
}

function GoalBar({ label, current, goal, prefix = "" }: {
  label: string; current: number; goal: number; prefix?: string;
}) {
  const pct = Math.min(100, (current / goal) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{prefix}{current} / {prefix}{goal} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ImpactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center rounded-lg border p-3">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
