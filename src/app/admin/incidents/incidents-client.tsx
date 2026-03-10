"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

type Incident = {
  id: string;
  event_id: string | null;
  severity: string;
  category: string;
  title: string;
  description: string | null;
  location: string | null;
  rider_name: string | null;
  rider_email: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
};

type Event = { id: string; title: string };

export function IncidentsClient({
  orgId,
  incidents: initial,
  events,
}: {
  orgId: string;
  incidents: Incident[];
  events: Event[];
}) {
  const [incidents, setIncidents] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [pending, startTransition] = useTransition();

  const filtered = incidents.filter((i) => {
    if (filter === "open") return !i.resolved_at;
    if (filter === "resolved") return !!i.resolved_at;
    return true;
  });

  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  async function createIncident(formData: FormData) {
    const body = {
      org_id: orgId,
      event_id: formData.get("event_id") || null,
      severity: formData.get("severity") || "low",
      category: formData.get("category") || "general",
      title: formData.get("title"),
      description: formData.get("description") || null,
      location: formData.get("location") || null,
      rider_name: formData.get("rider_name") || null,
      rider_email: formData.get("rider_email") || null,
    };

    const res = await fetch("/api/admin/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setIncidents((prev) => [data, ...prev]);
        setShowForm(false);
      });
    }
  }

  async function resolveIncident(id: string, resolution: string) {
    const res = await fetch("/api/admin/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolution }),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setIncidents((prev) =>
          prev.map((i) => (i.id === id ? data : i))
        );
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/coordinator">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Coordinator
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({incidents.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "open" ? "default" : "outline"}
            onClick={() => setFilter("open")}
          >
            Open ({incidents.filter((i) => !i.resolved_at).length})
          </Button>
          <Button
            size="sm"
            variant={filter === "resolved" ? "default" : "outline"}
            onClick={() => setFilter("resolved")}
          >
            Resolved ({incidents.filter((i) => i.resolved_at).length})
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> Report Incident
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Incident Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createIncident} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input name="title" required placeholder="Brief description of the incident" />
              </div>
              <div>
                <label className="text-sm font-medium">Event</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">No specific event</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <select name="severity" className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select name="category" className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="general">General</option>
                  <option value="medical">Medical</option>
                  <option value="mechanical">Mechanical</option>
                  <option value="weather">Weather</option>
                  <option value="route">Route Issue</option>
                  <option value="safety">Safety</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input name="location" placeholder="Where it happened" />
              </div>
              <div>
                <label className="text-sm font-medium">Rider Name</label>
                <Input name="rider_name" placeholder="Affected rider (if any)" />
              </div>
              <div>
                <label className="text-sm font-medium">Rider Email</label>
                <Input name="rider_email" type="email" placeholder="Rider email" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Full details..."
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Create Report</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No incidents found.</p>
        ) : (
          filtered.map((inc) => (
            <Card key={inc.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {inc.resolved_at ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-semibold">{inc.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant={
                          inc.severity === "critical" || inc.severity === "high"
                            ? "destructive"
                            : inc.severity === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {inc.severity}
                      </Badge>
                      <Badge variant="outline">{inc.category}</Badge>
                      {inc.event_id && <span>{eventMap.get(inc.event_id)}</span>}
                      <span>
                        {new Date(inc.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {inc.description && (
                      <p className="text-sm text-muted-foreground mt-1">{inc.description}</p>
                    )}
                    {inc.location && (
                      <p className="text-xs text-muted-foreground">Location: {inc.location}</p>
                    )}
                    {inc.rider_name && (
                      <p className="text-xs text-muted-foreground">
                        Rider: {inc.rider_name} {inc.rider_email && `(${inc.rider_email})`}
                      </p>
                    )}
                    {inc.resolution && (
                      <p className="text-sm mt-2 border-l-2 border-green-500 pl-3">
                        <span className="text-xs font-medium text-green-700">Resolution:</span>{" "}
                        {inc.resolution}
                      </p>
                    )}
                  </div>
                  {!inc.resolved_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const resolution = prompt("Enter resolution:");
                        if (resolution) resolveIncident(inc.id, resolution);
                      }}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
