"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";

type Deliverable = {
  id: string;
  sponsor_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  notes: string | null;
};

type Sponsor = { id: string; name: string; tier: string; status: string };
type Event = { id: string; title: string };

export function DeliverablesClient({
  orgId,
  deliverables: initial,
  sponsors,
  events,
}: {
  orgId: string;
  deliverables: Deliverable[];
  sponsors: Sponsor[];
  events: Event[];
}) {
  const [deliverables, setDeliverables] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"active" | "done" | "all">("active");
  const [, startTransition] = useTransition();

  const sponsorMap = new Map(sponsors.map((s) => [s.id, s]));
  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  const filtered = deliverables.filter((d) => {
    if (filter === "active") return d.status !== "done";
    if (filter === "done") return d.status === "done";
    return true;
  });

  async function createDeliverable(formData: FormData) {
    const body = {
      org_id: orgId,
      sponsor_id: formData.get("sponsor_id"),
      event_id: formData.get("event_id") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      due_date: formData.get("due_date") || null,
      notes: formData.get("notes") || null,
    };

    const res = await fetch("/api/admin/sponsor-deliverables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setDeliverables((prev) => [...prev, data]);
        setShowForm(false);
      });
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/sponsor-deliverables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setDeliverables((prev) => prev.map((d) => (d.id === id ? data : d)));
      });
    }
  }

  const pendingCount = deliverables.filter((d) => d.status === "pending").length;
  const inProgressCount = deliverables.filter((d) => d.status === "in_progress").length;
  const doneCount = deliverables.filter((d) => d.status === "done").length;
  const overdueCount = deliverables.filter(
    (d) => d.due_date && new Date(d.due_date) < new Date() && d.status !== "done"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/admin/coordinator">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Coordinator
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")}>
            Active ({pendingCount + inProgressCount})
          </Button>
          <Button size="sm" variant={filter === "done" ? "default" : "outline"} onClick={() => setFilter("done")}>
            Done ({doneCount})
          </Button>
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Deliverable
        </Button>
      </div>

      {overdueCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {overdueCount} deliverable{overdueCount > 1 ? "s" : ""} overdue
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Deliverable</CardTitle></CardHeader>
          <CardContent>
            <form action={createDeliverable} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Sponsor *</label>
                <select name="sponsor_id" className="w-full rounded-md border px-3 py-2 text-sm" required>
                  <option value="">Select sponsor...</option>
                  {sponsors.filter((s) => s.status === "committed" || s.status === "paid").map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.tier})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Event</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">General</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input name="title" required placeholder="e.g., Logo on event jersey, Social media shoutout" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input name="description" placeholder="Details about the deliverable" />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input name="due_date" type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Add Deliverable</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No deliverables found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const sponsor = sponsorMap.get(d.sponsor_id);
            const isOverdue = d.due_date && new Date(d.due_date) < new Date() && d.status !== "done";
            return (
              <div key={d.id} className={`flex items-center justify-between rounded-lg border p-3 text-sm ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateStatus(d.id, d.status === "pending" ? "in_progress" : d.status === "in_progress" ? "done" : "pending")} className="shrink-0">
                    {d.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : d.status === "in_progress" ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={d.status === "done" ? "line-through text-muted-foreground" : "font-medium"}>
                        {d.title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {sponsor && <span>{sponsor.name} ({sponsor.tier}) · </span>}
                      {d.event_id && <span>{eventMap.get(d.event_id)} · </span>}
                      {d.description && <span>{d.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.due_date && (
                    <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                      {new Date(d.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <Badge variant={d.status === "done" ? "outline" : d.status === "in_progress" ? "default" : "secondary"}>
                    {d.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
