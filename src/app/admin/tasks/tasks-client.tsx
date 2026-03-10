"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Task = {
  id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

type Event = { id: string; title: string };

export function TasksClient({
  orgId,
  tasks: initial,
  events,
}: {
  orgId: string;
  tasks: Task[];
  events: Event[];
}) {
  const [tasks, setTasks] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"active" | "done" | "all">("active");
  const [, startTransition] = useTransition();

  const filtered = tasks.filter((t) => {
    if (filter === "active") return t.status !== "done";
    if (filter === "done") return t.status === "done";
    return true;
  });

  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  async function createTask(formData: FormData) {
    const body = {
      org_id: orgId,
      event_id: formData.get("event_id") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      priority: formData.get("priority") || "medium",
      due_date: formData.get("due_date") || null,
    };

    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setTasks((prev) => [data, ...prev]);
        setShowForm(false);
      });
    }
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const res = await fetch("/api/admin/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });

    if (res.ok) {
      const { data } = await res.json();
      startTransition(() => {
        setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
      });
    }
  }

  function cycleStatus(task: Task) {
    const next = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";
    updateTask(task.id, { status: next });
  }

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
    if (pa !== pb) return pa - pb;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

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
            Active ({tasks.filter((t) => t.status !== "done").length})
          </Button>
          <Button size="sm" variant={filter === "done" ? "default" : "outline"} onClick={() => setFilter("done")}>
            Done ({tasks.filter((t) => t.status === "done").length})
          </Button>
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All ({tasks.length})
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Task</CardTitle></CardHeader>
          <CardContent>
            <form action={createTask} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input name="title" required placeholder="What needs to be done" />
              </div>
              <div>
                <label className="text-sm font-medium">Event</label>
                <select name="event_id" className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="">General</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select name="priority" className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input name="due_date" type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input name="description" placeholder="Details..." />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Create Task</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tasks found.</p>
        ) : (
          sorted.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => cycleStatus(task)} className="shrink-0">
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : task.status === "in_progress" ? (
                    <Clock className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <div>
                  <span className={task.status === "done" ? "line-through text-muted-foreground" : "font-medium"}>
                    {task.title}
                  </span>
                  {task.event_id && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({eventMap.get(task.event_id) ?? "Event"})
                    </span>
                  )}
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {task.due_date && (
                  <span className={`text-xs ${new Date(task.due_date) < new Date() && task.status !== "done" ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                    {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>
                  {task.priority}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
