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
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";

type LogisticsItem = {
  id: string;
  event_id: string;
  category: string;
  title: string;
  assigned_to: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
};

type Event = { id: string; title: string; date: string };

const CATEGORIES = ["signage", "food_water", "medical", "route", "equipment", "communication", "volunteer", "sponsor", "general"];

export function LogisticsClient({
  orgId,
  items: initial,
  events,
}: {
  orgId: string;
  items: LogisticsItem[];
  events: Event[];
}) {
  const [items, setItems] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>(events[0]?.id ?? "");
  const [, startTransition] = useTransition();

  const eventItems = selectedEvent
    ? items.filter((i) => i.event_id === selectedEvent)
    : items;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = eventItems.filter((i) => i.category === cat);
    if (catItems.length > 0) acc.push({ category: cat, items: catItems });
    return acc;
  }, [] as { category: string; items: LogisticsItem[] }[]);

  // Also include uncategorized
  const knownCats = new Set(CATEGORIES);
  const otherItems = eventItems.filter((i) => !knownCats.has(i.category));
  if (otherItems.length > 0) grouped.push({ category: "other", items: otherItems });

  const todoCount = eventItems.filter((i) => i.status === "todo").length;
  const inProgressCount = eventItems.filter((i) => i.status === "in_progress").length;
  const doneCount = eventItems.filter((i) => i.status === "done").length;

  async function addItem(formData: FormData) {
    const body = {
      org_id: orgId,
      event_id: formData.get("event_id"),
      category: formData.get("category") || "general",
      title: formData.get("title"),
      assigned_to: formData.get("assigned_to") || null,
      due_date: formData.get("due_date") || null,
      notes: formData.get("notes") || null,
    };

    const res = await fetch("/api/admin/logistics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setItems((prev) => [...prev, data]);
        setShowForm(false);
      });
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/logistics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
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

        <div className="flex items-center gap-3">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>

          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{todoCount}</p>
            <p className="text-xs text-muted-foreground">To Do</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{doneCount}</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Logistics Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addItem} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input name="title" required placeholder="What needs to be done" />
              </div>
              <div>
                <label className="text-sm font-medium">Event *</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue={selectedEvent} required>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select name="category" className="w-full rounded-md border px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned To</label>
                <Input name="assigned_to" placeholder="Person responsible" />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input name="due_date" type="date" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" placeholder="Additional details" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Add Item</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items by category */}
      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No logistics items yet. Add items to track event preparation.
        </p>
      ) : (
        grouped.map(({ category, items: catItems }) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{category.replace(/_/g, " ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateStatus(
                            item.id,
                            item.status === "todo"
                              ? "in_progress"
                              : item.status === "in_progress"
                              ? "done"
                              : "todo"
                          )
                        }
                        className="shrink-0"
                      >
                        {item.status === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : item.status === "in_progress" ? (
                          <Clock className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div>
                        <span className={item.status === "done" ? "line-through text-muted-foreground" : "font-medium"}>
                          {item.title}
                        </span>
                        {item.assigned_to && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.assigned_to})
                          </span>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.due_date && (
                        <span className={`text-xs ${new Date(item.due_date) < new Date() && item.status !== "done" ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                          {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <Badge variant={item.status === "done" ? "outline" : item.status === "in_progress" ? "default" : "secondary"}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
