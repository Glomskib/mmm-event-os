"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  EyeOff,
  XCircle,
} from "lucide-react";
import type {
  setEventStatus,
  createEvent,
  updateEvent,
} from "./actions";

type EventStatus = "draft" | "published" | "cancelled";

interface EventRow {
  id: string;
  title: string;
  slug: string | null;
  status: EventStatus;
  date: string;
  location: string | null;
  description: string | null;
  registration_open: boolean;
  capacity: number | null;
  series_key: string;
  event_type: string | null;
  fundraising_goal: number | null;
  rider_goal: number | null;
  sponsor_goal: number | null;
  volunteer_goal: number | null;
  weather_notes: string | null;
  post_event_notes: string | null;
  venue_details: string | null;
  elevation_gain: number | null;
  terrain_type: string | null;
}

const STATUS_COLORS: Record<EventStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export function EventsClient({
  events: initialEvents,
  orgId,
  setEventStatusAction,
  createEventAction,
  updateEventAction,
}: {
  events: EventRow[];
  orgId: string;
  setEventStatusAction: typeof setEventStatus;
  createEventAction: typeof createEvent;
  updateEventAction: typeof updateEvent;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSeriesKey, setNewSeriesKey] = useState("hhh");

  // Edit drawer
  const [selected, setSelected] = useState<EventRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRegOpen, setEditRegOpen] = useState(true);
  const [editCapacity, setEditCapacity] = useState("");
  const [editEventType, setEditEventType] = useState("");
  const [editFundraisingGoal, setEditFundraisingGoal] = useState("");
  const [editRiderGoal, setEditRiderGoal] = useState("");
  const [editSponsorGoal, setEditSponsorGoal] = useState("");
  const [editVolunteerGoal, setEditVolunteerGoal] = useState("");
  const [editWeatherNotes, setEditWeatherNotes] = useState("");
  const [editPostEventNotes, setEditPostEventNotes] = useState("");
  const [editVenueDetails, setEditVenueDetails] = useState("");
  const [editElevationGain, setEditElevationGain] = useState("");
  const [editTerrainType, setEditTerrainType] = useState("");

  function clearResult() {
    setTimeout(() => setResult(null), 4000);
  }

  function openEdit(event: EventRow) {
    setSelected(event);
    setEditTitle(event.title);
    setEditDate(event.date ? event.date.slice(0, 16) : "");
    setEditLocation(event.location ?? "");
    setEditDescription(event.description ?? "");
    setEditRegOpen(event.registration_open);
    setEditCapacity(event.capacity ? String(event.capacity) : "");
    setEditEventType(event.event_type ?? "ride");
    setEditFundraisingGoal(event.fundraising_goal ? String(event.fundraising_goal) : "");
    setEditRiderGoal(event.rider_goal ? String(event.rider_goal) : "");
    setEditSponsorGoal(event.sponsor_goal ? String(event.sponsor_goal) : "");
    setEditVolunteerGoal(event.volunteer_goal ? String(event.volunteer_goal) : "");
    setEditWeatherNotes(event.weather_notes ?? "");
    setEditPostEventNotes(event.post_event_notes ?? "");
    setEditVenueDetails(event.venue_details ?? "");
    setEditElevationGain(event.elevation_gain ? String(event.elevation_gain) : "");
    setEditTerrainType(event.terrain_type ?? "");
    setDrawerOpen(true);
  }

  function handleCreate() {
    if (!newTitle.trim() || !newDate) return;
    setResult(null);
    startTransition(async () => {
      const res = await createEventAction({
        orgId,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        location: newLocation.trim() || undefined,
        date: new Date(newDate).toISOString(),
        seriesKey: newSeriesKey,
      });
      if (res.ok) {
        setNewTitle(""); setNewDate(""); setNewLocation("");
        setNewDescription(""); setNewSeriesKey("hhh");
        setShowAddForm(false);
        setResult({ type: "success", message: "Event created (draft)." });
        clearResult();
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  function handleStatusChange(eventId: string, status: EventStatus) {
    startTransition(async () => {
      const res = await setEventStatusAction(eventId, status);
      if (res.ok) {
        setResult({
          type: "success",
          message: `Status set to ${status}.`,
        });
        clearResult();
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  function handleSaveEdit() {
    if (!selected) return;
    startTransition(async () => {
      const res = await updateEventAction(selected.id, {
        title: editTitle.trim() || undefined,
        description: editDescription.trim() || undefined,
        location: editLocation.trim() || undefined,
        date: editDate ? new Date(editDate).toISOString() : undefined,
        registrationOpen: editRegOpen,
        capacity: editCapacity ? parseInt(editCapacity) : null,
        eventType: editEventType || undefined,
        fundraisingGoal: editFundraisingGoal ? parseInt(editFundraisingGoal) : null,
        riderGoal: editRiderGoal ? parseInt(editRiderGoal) : null,
        sponsorGoal: editSponsorGoal ? parseInt(editSponsorGoal) : null,
        volunteerGoal: editVolunteerGoal ? parseInt(editVolunteerGoal) : null,
        weatherNotes: editWeatherNotes.trim() || undefined,
        postEventNotes: editPostEventNotes.trim() || undefined,
        venueDetails: editVenueDetails.trim() || undefined,
        elevationGain: editElevationGain ? parseInt(editElevationGain) : null,
        terrainType: editTerrainType || undefined,
      });
      if (res.ok) {
        setDrawerOpen(false);
        setResult({ type: "success", message: "Event updated." });
        clearResult();
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  const drafts = initialEvents.filter((e) => e.status === "draft");
  const published = initialEvents.filter((e) => e.status === "published");
  const cancelled = initialEvents.filter((e) => e.status === "cancelled");

  return (
    <div className="space-y-6">
      {result && (
        <div
          className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
            result.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{result.message}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Event
        </Button>
        <p className="text-sm text-muted-foreground">
          {published.length} published · {drafts.length} draft
          {cancelled.length > 0 && ` · ${cancelled.length} cancelled`}
        </p>
      </div>

      {/* Create form */}
      {showAddForm && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Title *</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Hancock Horizontal Hundred 2026"
                />
              </div>
              <div className="space-y-1">
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Series Key</Label>
                <Input
                  value={newSeriesKey}
                  onChange={(e) => setNewSeriesKey(e.target.value)}
                  placeholder="hhh"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Location</Label>
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Findlay, OH"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={isPending || !newTitle.trim() || !newDate}
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                Create as Draft
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events table */}
      {initialEvents.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No events yet. Create one above.
        </p>
      ) : (
        <Card>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Title</th>
                    <th className="px-4 py-2 text-left font-medium">Date</th>
                    <th className="px-4 py-2 text-left font-medium">Series</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {initialEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <button
                          className="font-medium hover:underline text-left"
                          onClick={() => openEdit(event)}
                        >
                          {event.title}
                        </button>
                        {event.slug && (
                          <p className="text-xs text-muted-foreground">
                            /{event.slug}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground uppercase text-xs">
                        {event.series_key}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          className={STATUS_COLORS[event.status]}
                          variant="secondary"
                        >
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          {event.status !== "published" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(event.id, "published")
                              }
                              disabled={isPending}
                              title="Publish"
                            >
                              <Globe className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                          )}
                          {event.status === "published" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(event.id, "draft")
                              }
                              disabled={isPending}
                              title="Unpublish (set to draft)"
                            >
                              <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                            </Button>
                          )}
                          {event.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(event.id, "cancelled")
                              }
                              disabled={isPending}
                              title="Cancel event"
                            >
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                          {event.slug && (
                            <a
                              href={`/events/${event.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                              title="Preview event page"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Event</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Changing the title regenerates the slug.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Capacity (leave blank for unlimited)</Label>
                  <Input
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editRegOpen}
                    onChange={(e) => setEditRegOpen(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Registration open
                </label>

                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-3">Event Type & Details</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Event Type</Label>
                      <select
                        value={editEventType}
                        onChange={(e) => setEditEventType(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="ride">Ride</option>
                        <option value="gravel">Gravel Event</option>
                        <option value="fundraiser">Fundraiser</option>
                        <option value="social">Social / Community</option>
                        <option value="race">Race</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Terrain Type</Label>
                      <select
                        value={editTerrainType}
                        onChange={(e) => setEditTerrainType(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">Not set</option>
                        <option value="road">Road</option>
                        <option value="gravel">Gravel</option>
                        <option value="mixed">Mixed</option>
                        <option value="trail">Trail</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Elevation Gain (ft)</Label>
                      <Input
                        type="number"
                        value={editElevationGain}
                        onChange={(e) => setEditElevationGain(e.target.value)}
                        placeholder="e.g., 3500"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Venue Details</Label>
                      <Textarea
                        value={editVenueDetails}
                        onChange={(e) => setEditVenueDetails(e.target.value)}
                        rows={2}
                        placeholder="Parking info, address, check-in location..."
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-3">Goals</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Rider Goal</Label>
                      <Input
                        type="number"
                        value={editRiderGoal}
                        onChange={(e) => setEditRiderGoal(e.target.value)}
                        placeholder="e.g., 400"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fundraising Goal ($)</Label>
                      <Input
                        type="number"
                        value={editFundraisingGoal}
                        onChange={(e) => setEditFundraisingGoal(e.target.value)}
                        placeholder="e.g., 25000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Sponsor Goal</Label>
                      <Input
                        type="number"
                        value={editSponsorGoal}
                        onChange={(e) => setEditSponsorGoal(e.target.value)}
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Volunteer Goal</Label>
                      <Input
                        type="number"
                        value={editVolunteerGoal}
                        onChange={(e) => setEditVolunteerGoal(e.target.value)}
                        placeholder="e.g., 50"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-3">Operational Notes</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Weather Notes</Label>
                      <Textarea
                        value={editWeatherNotes}
                        onChange={(e) => setEditWeatherNotes(e.target.value)}
                        rows={2}
                        placeholder="Forecast, contingency plans..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Post-Event Notes</Label>
                      <Textarea
                        value={editPostEventNotes}
                        onChange={(e) => setEditPostEventNotes(e.target.value)}
                        rows={2}
                        placeholder="Lessons learned, results, impact..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>

                  {/* Quick status buttons */}
                  <div className="flex gap-1 ml-auto">
                    {selected.status !== "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleStatusChange(selected.id, "published");
                          setDrawerOpen(false);
                        }}
                        disabled={isPending}
                      >
                        <Globe className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                        Publish
                      </Button>
                    )}
                    {selected.status === "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleStatusChange(selected.id, "draft");
                          setDrawerOpen(false);
                        }}
                        disabled={isPending}
                      >
                        <EyeOff className="mr-1 h-3.5 w-3.5 text-amber-600" />
                        Unpublish
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
