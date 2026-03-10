"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Truck } from "lucide-react";
import Link from "next/link";

type SagVehicle = {
  id: string;
  event_id: string;
  driver_name: string;
  driver_phone: string | null;
  vehicle_description: string | null;
  zone: string | null;
  radio_channel: string | null;
  status: string;
  notes: string | null;
};

type Event = { id: string; title: string };

export function SagClient({
  orgId,
  vehicles: initial,
  events,
}: {
  orgId: string;
  vehicles: SagVehicle[];
  events: Event[];
}) {
  const [vehicles, setVehicles] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id ?? "");
  const [, startTransition] = useTransition();

  const filtered = selectedEvent ? vehicles.filter((v) => v.event_id === selectedEvent) : vehicles;

  async function createVehicle(formData: FormData) {
    const body = {
      org_id: orgId,
      event_id: formData.get("event_id"),
      driver_name: formData.get("driver_name"),
      driver_phone: formData.get("driver_phone") || null,
      vehicle_description: formData.get("vehicle_description") || null,
      zone: formData.get("zone") || null,
      radio_channel: formData.get("radio_channel") || null,
      notes: formData.get("notes") || null,
    };

    const res = await fetch("/api/admin/sag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setVehicles((prev) => [...prev, data]);
        setShowForm(false);
      });
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/sag", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setVehicles((prev) => prev.map((v) => (v.id === id ? data : v)));
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
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="">All Events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New SAG Vehicle</CardTitle></CardHeader>
          <CardContent>
            <form action={createVehicle} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Driver Name *</label>
                <Input name="driver_name" required />
              </div>
              <div>
                <label className="text-sm font-medium">Event *</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={selectedEvent} required>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Driver Phone</label>
                <Input name="driver_phone" type="tel" />
              </div>
              <div>
                <label className="text-sm font-medium">Vehicle Description</label>
                <Input name="vehicle_description" placeholder="e.g., White F-150" />
              </div>
              <div>
                <label className="text-sm font-medium">Zone</label>
                <Input name="zone" placeholder="e.g., Miles 0-30" />
              </div>
              <div>
                <label className="text-sm font-medium">Radio Channel</label>
                <Input name="radio_channel" placeholder="e.g., Channel 5" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Add Vehicle</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No SAG vehicles assigned.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  {v.driver_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {v.driver_phone && <p>Phone: {v.driver_phone}</p>}
                {v.vehicle_description && <p>{v.vehicle_description}</p>}
                {v.zone && <p>Zone: {v.zone}</p>}
                {v.radio_channel && <p>Radio: {v.radio_channel}</p>}
                {v.notes && <p className="text-muted-foreground">{v.notes}</p>}
                <div className="flex items-center justify-between pt-2">
                  <Badge variant={v.status === "active" ? "default" : v.status === "responding" ? "destructive" : "secondary"}>
                    {v.status}
                  </Badge>
                  <div className="flex gap-1">
                    {["standby", "active", "responding", "off_duty"].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={v.status === s ? "default" : "ghost"}
                        className="h-6 px-2 text-xs"
                        onClick={() => updateStatus(v.id, s)}
                      >
                        {s.replace(/_/g, " ")}
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
