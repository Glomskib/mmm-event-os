"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, DollarSign } from "lucide-react";
import Link from "next/link";

type Summary = {
  id: string;
  event_id: string | null;
  period: string | null;
  gross_registration_revenue: number;
  net_registration_revenue: number;
  sponsor_revenue: number;
  donation_revenue: number;
  merch_revenue: number;
  in_kind_value: number;
  total_expenses: number;
  notes: string | null;
  created_at: string;
};

type Event = { id: string; title: string; date: string };

export function FinancialClient({
  orgId,
  summaries: initial,
  events,
}: {
  orgId: string;
  summaries: Summary[];
  events: Event[];
}) {
  const [summaries, setSummaries] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  async function createSummary(formData: FormData) {
    const toCents = (v: string | null) => Math.round((parseFloat(v ?? "0") || 0) * 100);
    const body = {
      org_id: orgId,
      event_id: formData.get("event_id") || null,
      period: formData.get("period") || null,
      gross_registration_revenue: toCents(formData.get("gross_registration_revenue") as string),
      net_registration_revenue: toCents(formData.get("net_registration_revenue") as string),
      sponsor_revenue: toCents(formData.get("sponsor_revenue") as string),
      donation_revenue: toCents(formData.get("donation_revenue") as string),
      merch_revenue: toCents(formData.get("merch_revenue") as string),
      in_kind_value: toCents(formData.get("in_kind_value") as string),
      total_expenses: toCents(formData.get("total_expenses") as string),
      notes: formData.get("notes") || null,
    };

    const res = await fetch("/api/admin/financial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setSummaries((prev) => [data, ...prev]);
        setShowForm(false);
      });
    }
  }

  // Totals
  const totalGross = summaries.reduce((s, r) => s + r.gross_registration_revenue, 0);
  const totalSponsor = summaries.reduce((s, r) => s + r.sponsor_revenue, 0);
  const totalDonation = summaries.reduce((s, r) => s + r.donation_revenue, 0);
  const totalExpenses = summaries.reduce((s, r) => s + r.total_expenses, 0);
  const totalRevenue = totalGross + totalSponsor + totalDonation;
  const netMargin = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/executive">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Executive Dashboard
          </Button>
        </Link>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Summary
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{fmt(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-600">{fmt(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className={`text-2xl font-bold ${netMargin >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(netMargin)}</p>
            <p className="text-xs text-muted-foreground">Net Margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{summaries.length}</p>
            <p className="text-xs text-muted-foreground">Entries</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Financial Summary</CardTitle></CardHeader>
          <CardContent>
            <form action={createSummary} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Event</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">Org-Wide</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Period</label>
                <Input name="period" placeholder="e.g., 2026-Q1, March 2026" />
              </div>
              <div>
                <label className="text-sm font-medium">Gross Reg Revenue ($)</label>
                <Input name="gross_registration_revenue" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Net Reg Revenue ($)</label>
                <Input name="net_registration_revenue" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Sponsor Revenue ($)</label>
                <Input name="sponsor_revenue" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Donation Revenue ($)</label>
                <Input name="donation_revenue" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Merch Revenue ($)</label>
                <Input name="merch_revenue" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="text-sm font-medium">In-Kind Value ($)</label>
                <Input name="in_kind_value" type="number" step="0.01" defaultValue="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Total Expenses ($)</label>
                <Input name="total_expenses" type="number" step="0.01" defaultValue="0" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" placeholder="Notes about this period" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit">Save Summary</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {summaries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No financial summaries yet.</p>
      ) : (
        <Card>
          <CardContent className="py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3">Event/Period</th>
                    <th className="pb-2 pr-3 text-right">Reg Rev</th>
                    <th className="pb-2 pr-3 text-right">Sponsor</th>
                    <th className="pb-2 pr-3 text-right">Donations</th>
                    <th className="pb-2 pr-3 text-right">Merch</th>
                    <th className="pb-2 pr-3 text-right">Expenses</th>
                    <th className="pb-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summaries.map((s) => {
                    const total = s.gross_registration_revenue + s.sponsor_revenue + s.donation_revenue + s.merch_revenue;
                    const net = total - s.total_expenses;
                    return (
                      <tr key={s.id}>
                        <td className="py-2 pr-3">
                          <span className="font-medium">{s.event_id ? eventMap.get(s.event_id) ?? "Event" : "Org-Wide"}</span>
                          {s.period && <span className="text-xs text-muted-foreground ml-1">({s.period})</span>}
                          {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(s.gross_registration_revenue)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(s.sponsor_revenue)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(s.donation_revenue)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(s.merch_revenue)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(s.total_expenses)}</td>
                        <td className={`py-2 text-right tabular-nums font-semibold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {fmt(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
