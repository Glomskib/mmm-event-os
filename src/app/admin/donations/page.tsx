import { requireAdmin } from "@/lib/require-admin";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { Hero } from "@/components/layout/hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Heart, DollarSign, Repeat, EyeOff } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Donations | Admin" };

type Donation = {
  id: string;
  stripe_session_id: string | null;
  amount: number;
  net_amount: number | null;
  donor_email: string | null;
  donor_name: string | null;
  event_id: string | null;
  recurring: boolean;
  anonymous: boolean;
  source: string;
  notes: string | null;
  created_at: string;
};

type Event = { id: string; title: string };

export default async function DonationsPage() {
  await requireAdmin();
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: donationsRaw }, { data: eventsRaw }] = await Promise.all([
    db
      .from("donations")
      .select("id, stripe_session_id, amount, net_amount, donor_email, donor_name, event_id, recurring, anonymous, source, notes, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    db.from("events").select("id, title").eq("org_id", org.id),
  ]);

  const donations = (donationsRaw ?? []) as Donation[];
  const events = (eventsRaw ?? []) as Event[];
  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  const totalRaised = donations.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const totalNet = donations.reduce((sum, d) => sum + (d.net_amount ?? d.amount ?? 0), 0);
  const recurringCount = donations.filter((d) => d.recurring).length;

  const bySource = new Map<string, { count: number; amount: number }>();
  for (const d of donations) {
    const src = d.source || "website";
    const existing = bySource.get(src) ?? { count: 0, amount: 0 };
    existing.count++;
    existing.amount += d.amount;
    bySource.set(src, existing);
  }

  const byEvent = new Map<string, { count: number; amount: number }>();
  for (const d of donations) {
    if (!d.event_id) continue;
    const name = eventMap.get(d.event_id) ?? "Unknown";
    const existing = byEvent.get(name) ?? { count: 0, amount: 0 };
    existing.count++;
    existing.amount += d.amount;
    byEvent.set(name, existing);
  }

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Hero title="Donations" subtitle="Track all donations and donor attribution" />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Button>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{fmt(totalRaised)}</p>
                <p className="text-xs text-muted-foreground">Total Raised (Gross)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <DollarSign className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{fmt(totalNet)}</p>
                <p className="text-xs text-muted-foreground">Net (After Fees)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <Repeat className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{recurringCount}</p>
                <p className="text-xs text-muted-foreground">Recurring Donors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{donations.length}</p>
                <p className="text-xs text-muted-foreground">Total Donations</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {bySource.size > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">By Source</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...bySource.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([source, data]) => (
                    <div key={source} className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{source}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{data.count}</Badge>
                        <span className="tabular-nums w-20 text-right">{fmt(data.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {byEvent.size > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">By Event</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...byEvent.entries()].sort((a, b) => b[1].amount - a[1].amount).map(([event, data]) => (
                    <div key={event} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{event}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{data.count}</Badge>
                        <span className="tabular-nums w-20 text-right">{fmt(data.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              All Donations ({donations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No donations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-3">Date</th>
                      <th className="pb-2 pr-3">Donor</th>
                      <th className="pb-2 pr-3 text-right">Amount</th>
                      <th className="pb-2 pr-3 text-right">Net</th>
                      <th className="pb-2 pr-3">Event</th>
                      <th className="pb-2 pr-3">Source</th>
                      <th className="pb-2">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {donations.map((d) => (
                      <tr key={d.id}>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2 pr-3">
                          {d.anonymous ? (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="h-3 w-3" /> Anonymous
                            </span>
                          ) : (
                            <div>
                              <span className="font-medium">{d.donor_name || d.donor_email || "—"}</span>
                              {d.donor_name && d.donor_email && (
                                <p className="text-xs text-muted-foreground">{d.donor_email}</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums font-medium">{fmt(d.amount)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                          {d.net_amount ? fmt(d.net_amount) : "—"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {d.event_id ? eventMap.get(d.event_id) ?? "—" : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant="secondary" className="capitalize">{d.source || "website"}</Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            {d.recurring && <Badge variant="default">Recurring</Badge>}
                            {d.anonymous && <Badge variant="outline">Anonymous</Badge>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
