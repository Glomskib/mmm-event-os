"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, MapPin } from "lucide-react";
import Link from "next/link";

type Station = {
  id: string;
  event_id: string;
  name: string;
  location: string | null;
  mile_marker: number | null;
  captain_name: string | null;
  captain_phone: string | null;
  water_gallons: number;
  food_items: string | null;
  medical_kit: boolean;
  status: string;
  notes: string | null;
};

type Event = { id: string; title: string };

export function AidStationsClient({
  orgId,
  stations: initial,
  events,
}: {
  orgId: string;
  stations: Station[];
  events: Event[];
}) {
  const [stations, setStations] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id ?? "");
  const [, startTransition] = useTransition();

  const filtered = selectedEvent ? stations.filter((s) => s.event_id === selectedEvent) : stations;
  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  async function createStation(formData: FormData) {
    const body = {
      org_id: orgId,
      event_id: formData.get("event_id"),
      name: formData.get("name"),
      location: formData.get("location") || null,
      mile_marker: formData.get("mile_marker") ? Number(formData.get("mile_marker")) : null,
      captain_name: formData.get("captain_name") || null,
      captain_phone: formData.get("captain_phone") || null,
      water_gallons: Number(formData.get("water_gallons")) || 0,
      food_items: formData.get("food_items") || null,
      medical_kit: formData.get("medical_kit") === "on",
      notes: formData.get("notes") || null,
    };

    const res = await fetch("/api/admin/aid-stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setStations((prev) => [...prev, data]);
        setShowForm(false);
      });
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/aid-stations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setStations((prev) => prev.map((s) => (s.id === id ? data : s)));
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/admin/coordinator">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Coordinator
          </Button>
        </Link>
        <div className="flex gap-3">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Station
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Aid Station</CardTitle></CardHeader>
          <CardContent>
            <form action={createStation} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input name="name" required placeholder="e.g., Mile 25 Rest Stop" />
              </div>
              <div>
                <label className="text-sm font-medium">Event *</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={selectedEvent} required>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input name="location" placeholder="Address or description" />
              </div>
              <div>
                <label className="text-sm font-medium">Mile Marker</label>
                <Input name="mile_marker" type="number" step="0.1" placeholder="25.0" />
              </div>
              <div>
                <label className="text-sm font-medium">Captain Name</label>
                <Input name="captain_name" placeholder="Station captain" />
              </div>
              <div>
                <label className="text-sm font-medium">Captain Phone</label>
                <Input name="captain_phone" type="tel" placeholder="Phone number" />
              </div>
              <div>
                <label className="text-sm font-medium">Water (gallons)</label>
                <Input name="water_gallons" type="number" defaultValue="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Food Items</label>
                <Input name="food_items" placeholder="Bananas, bars, etc." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="medical_kit" id="medical_kit" className="h-4 w-4" />
                <label htmlFor="medical_kit" className="text-sm font-medium">Medical kit available</label>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" placeholder="Additional details" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Add Station</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No aid stations configured.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((station) => (
            <Card key={station.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  {station.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {station.mile_marker != null && (
                  <p>Mile {station.mile_marker}</p>
                )}
                {station.location && <p className="text-muted-foreground">{station.location}</p>}
                {station.captain_name && (
                  <p>Captain: {station.captain_name} {station.captain_phone && `(${station.captain_phone})`}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">Water: {station.water_gallons}gal</Badge>
                  {station.food_items && <Badge variant="secondary">Food: {station.food_items}</Badge>}
                  {station.medical_kit && <Badge variant="default">Medical Kit</Badge>}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant={station.status === "ready" ? "default" : station.status === "active" ? "destructive" : "secondary"}>
                    {station.status}
                  </Badge>
                  <div className="flex gap-1">
                    {["planned", "ready", "active", "closed"].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={station.status === s ? "default" : "ghost"}
                        className="h-6 px-2 text-xs"
                        onClick={() => updateStatus(station.id, s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
