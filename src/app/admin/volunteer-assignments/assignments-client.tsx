"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, CheckCircle2, Circle, HandHeart } from "lucide-react";
import Link from "next/link";

type Assignment = {
  id: string;
  volunteer_id: string;
  event_id: string | null;
  role: string;
  shift_start: string | null;
  shift_end: string | null;
  location: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  hours_served: number;
  notes: string | null;
};

type Volunteer = { id: string; name: string; email: string; phone: string | null };
type Event = { id: string; title: string };

export function VolunteerAssignmentsClient({
  orgId,
  assignments: initial,
  volunteers,
  events,
}: {
  orgId: string;
  assignments: Assignment[];
  volunteers: Volunteer[];
  events: Event[];
}) {
  const [assignments, setAssignments] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id ?? "");
  const [, startTransition] = useTransition();

  const filtered = selectedEvent
    ? assignments.filter((a) => a.event_id === selectedEvent)
    : assignments;

  const volunteerMap = new Map(volunteers.map((v) => [v.id, v]));
  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  async function createAssignment(formData: FormData) {
    const body = {
      org_id: orgId,
      volunteer_id: formData.get("volunteer_id"),
      event_id: formData.get("event_id") || null,
      role: formData.get("role"),
      shift_start: formData.get("shift_start") || null,
      shift_end: formData.get("shift_end") || null,
      location: formData.get("location") || null,
      notes: formData.get("notes") || null,
    };

    const res = await fetch("/api/admin/volunteer-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setAssignments((prev) => [...prev, data]);
        setShowForm(false);
      });
    }
  }

  async function toggleCheckin(id: string, checked_in: boolean) {
    const res = await fetch("/api/admin/volunteer-assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checked_in }),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setAssignments((prev) => prev.map((a) => (a.id === id ? data : a)));
      });
    }
  }

  const totalHours = filtered.reduce((s, a) => s + (a.hours_served ?? 0), 0);
  const checkedInCount = filtered.filter((a) => a.checked_in).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/admin/coordinator">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Coordinator
          </Button>
        </Link>
        <div className="flex gap-3">
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="">All Events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="h-4 w-4" /> Assign Volunteer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">Assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Assignment</CardTitle></CardHeader>
          <CardContent>
            <form action={createAssignment} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Volunteer *</label>
                <select name="volunteer_id" className="w-full rounded-md border px-3 py-2 text-sm" required>
                  <option value="">Select volunteer...</option>
                  {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.email})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Event</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={selectedEvent}>
                  <option value="">General</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Role *</label>
                <Input name="role" required placeholder="e.g., Aid Station, Marshal, Registration" />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input name="location" placeholder="Where they report to" />
              </div>
              <div>
                <label className="text-sm font-medium">Shift Start</label>
                <Input name="shift_start" type="datetime-local" />
              </div>
              <div>
                <label className="text-sm font-medium">Shift End</label>
                <Input name="shift_end" type="datetime-local" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Assign</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No assignments yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const vol = volunteerMap.get(a.volunteer_id);
            return (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleCheckin(a.id, !a.checked_in)} className="shrink-0">
                    {a.checked_in ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <HandHeart className="h-4 w-4 text-rose-500" />
                      <span className="font-medium">{vol?.name ?? "Unknown"}</span>
                      <Badge variant="secondary">{a.role}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.event_id && <span>{eventMap.get(a.event_id)} · </span>}
                      {a.location && <span>{a.location} · </span>}
                      {a.shift_start && (
                        <span>
                          {new Date(a.shift_start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          {a.shift_end && ` - ${new Date(a.shift_end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.hours_served > 0 && (
                    <span className="text-xs text-muted-foreground">{a.hours_served}h</span>
                  )}
                  <Badge variant={a.checked_in ? "default" : "outline"}>
                    {a.checked_in ? "Present" : "Expected"}
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
