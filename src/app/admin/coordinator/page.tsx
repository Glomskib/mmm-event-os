import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  MapPin,
  Truck,
  HandHeart,
  Handshake,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Coordinator Dashboard | Admin" };
export const revalidate = 30;

export default async function CoordinatorDashboardPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  // Parallel fetch all coordinator data
  const [
    { data: events },
    { data: registrations },
    { data: volunteers },
    { data: assignments },
    { data: incidents },
    { data: logistics },
    { data: tasks },
    { data: aidStations },
    { data: sagVehicles },
    { data: deliverables },
    { data: sponsors },
  ] = await Promise.all([
    db
      .from("events")
      .select("id, title, slug, date, status, location, capacity, rider_goal, volunteer_goal, sponsor_goal")
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("date", { ascending: true })
      .limit(10),
    db
      .from("registrations")
      .select("id, event_id, status, waiver_accepted, participant_name, participant_email, emergency_contact_name, emergency_contact_phone, bib_issued, checked_in_at, packet_picked_up, medical_info, shirt_size")
      .eq("org_id", org.id)
      .in("status", ["paid", "free"]),
    db
      .from("volunteer_signups")
      .select("id, name, email, phone, status, training_complete")
      .order("created_at", { ascending: false }),
    db
      .from("volunteer_assignments")
      .select("id, volunteer_id, event_id, role, shift_start, shift_end, location, checked_in, hours_served")
      .eq("org_id", org.id),
    db
      .from("incident_reports")
      .select("id, event_id, severity, category, title, resolution, resolved_at, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("event_logistics_items")
      .select("id, event_id, category, title, status, due_date, assigned_to")
      .eq("org_id", org.id)
      .order("sort_order"),
    db
      .from("tasks")
      .select("id, event_id, title, status, priority, due_date, assigned_to")
      .eq("org_id", org.id)
      .in("status", ["todo", "in_progress"])
      .order("due_date", { ascending: true })
      .limit(20),
    db
      .from("aid_stations")
      .select("id, event_id, name, status, captain_name")
      .eq("org_id", org.id),
    db
      .from("sag_assignments")
      .select("id, event_id, driver_name, status, zone")
      .eq("org_id", org.id),
    db
      .from("sponsorship_deliverables")
      .select("id, sponsor_id, title, status, due_date")
      .eq("org_id", org.id)
      .in("status", ["pending", "in_progress"]),
    db
      .from("sponsors")
      .select("id, name, status, committed_amount, tier")
      .eq("org_id", org.id)
      .in("status", ["committed", "paid"]),
  ]);

  const allEvents = (events ?? []) as Array<{
    id: string; title: string; slug: string; date: string;
    status: string; location: string; capacity: number | null;
    rider_goal: number | null; volunteer_goal: number | null; sponsor_goal: number | null;
  }>;
  const allRegs = (registrations ?? []) as Array<{
    id: string; event_id: string; status: string; waiver_accepted: boolean;
    participant_name: string; participant_email: string;
    emergency_contact_name: string; emergency_contact_phone: string;
    bib_issued: boolean; checked_in_at: string | null;
    packet_picked_up: boolean; medical_info: string | null; shirt_size: string | null;
  }>;
  const allVolunteers = (volunteers ?? []) as Array<{
    id: string; name: string; email: string; phone: string | null;
    status: string | null; training_complete: boolean | null;
  }>;
  const allAssignments = (assignments ?? []) as Array<{
    id: string; volunteer_id: string; event_id: string; role: string;
    shift_start: string | null; shift_end: string | null; location: string | null;
    checked_in: boolean; hours_served: number;
  }>;
  const allIncidents = (incidents ?? []) as Array<{
    id: string; event_id: string; severity: string; category: string;
    title: string; resolution: string | null; resolved_at: string | null; created_at: string;
  }>;
  const allLogistics = (logistics ?? []) as Array<{
    id: string; event_id: string; category: string; title: string;
    status: string; due_date: string | null; assigned_to: string | null;
  }>;
  const allTasks = (tasks ?? []) as Array<{
    id: string; event_id: string; title: string; status: string;
    priority: string; due_date: string | null; assigned_to: string | null;
  }>;
  const allAidStations = (aidStations ?? []) as Array<{
    id: string; event_id: string; name: string; status: string; captain_name: string | null;
  }>;
  const allSag = (sagVehicles ?? []) as Array<{
    id: string; event_id: string; driver_name: string; status: string; zone: string | null;
  }>;
  const allDeliverables = (deliverables ?? []) as Array<{
    id: string; sponsor_id: string; title: string; status: string; due_date: string | null;
  }>;
  const allSponsors = (sponsors ?? []) as Array<{
    id: string; name: string; status: string; committed_amount: number | null; tier: string;
  }>;

  // Compute metrics
  const missingWaivers = allRegs.filter((r) => !r.waiver_accepted);
  const missingEmergency = allRegs.filter((r) => !r.emergency_contact_name);
  const missingMedical = allRegs.filter((r) => !r.medical_info);
  const openIncidents = allIncidents.filter((r) => !r.resolved_at);
  const highPriorityTasks = allTasks.filter((t) => t.priority === "high" || t.priority === "urgent");
  const overdueTasks = allTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date());
  const logisticsTodo = allLogistics.filter((l) => l.status === "todo");
  const logisticsInProgress = allLogistics.filter((l) => l.status === "in_progress");
  const logisticsDone = allLogistics.filter((l) => l.status === "done");

  // Next upcoming event
  const nextEvent = allEvents.find((e) => new Date(e.date) >= new Date());
  const nextEventRegs = nextEvent ? allRegs.filter((r) => r.event_id === nextEvent.id) : [];

  const eventMap = new Map(allEvents.map((e) => [e.id, e.title]));
  const sponsorMap = new Map(allSponsors.map((s) => [s.id, s.name]));

  return (
    <>
      <Hero
        title="Coordinator Dashboard"
        subtitle="Execution, logistics, riders, volunteers, sponsors"
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mb-2 gap-1">
            <ArrowLeft className="h-4 w-4" /> Admin Home
          </Button>
        </Link>

        {/* ── Quick Stats ─────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Active Riders" value={allRegs.length} color="text-blue-600" />
          <StatCard icon={HandHeart} label="Volunteers" value={allVolunteers.length} color="text-rose-500" />
          <StatCard icon={AlertTriangle} label="Open Incidents" value={openIncidents.length} color="text-red-600" />
          <StatCard icon={ClipboardCheck} label="Tasks Due" value={allTasks.length} color="text-amber-600" />
        </div>

        {/* ── Next Event Readiness ────────────────────────────── */}
        {nextEvent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Next Event: {nextEvent.title}
              </CardTitle>
              <CardDescription>
                {new Date(nextEvent.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {nextEvent.location && ` · ${nextEvent.location}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MiniStat
                  label="Riders Registered"
                  value={nextEventRegs.length}
                  goal={nextEvent.rider_goal ?? undefined}
                />
                <MiniStat
                  label="Waivers Missing"
                  value={nextEventRegs.filter((r) => !r.waiver_accepted).length}
                  warn
                />
                <MiniStat
                  label="Aid Stations"
                  value={allAidStations.filter((a) => a.event_id === nextEvent.id).length}
                />
                <MiniStat
                  label="SAG Vehicles"
                  value={allSag.filter((s) => s.event_id === nextEvent.id).length}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin/event-day">
                  <Button size="sm">Event Day Dashboard</Button>
                </Link>
                <Link href="/admin/logistics">
                  <Button size="sm" variant="outline">Logistics Checklist</Button>
                </Link>
                <Link href="/admin/aid-stations">
                  <Button size="sm" variant="outline">Aid Stations</Button>
                </Link>
                <Link href="/admin/sag">
                  <Button size="sm" variant="outline">SAG Vehicles</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Rider Alerts ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Rider Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertRow
                label="Missing waiver"
                count={missingWaivers.length}
                severity={missingWaivers.length > 0 ? "warn" : "ok"}
              />
              <AlertRow
                label="Missing emergency contact"
                count={missingEmergency.length}
                severity={missingEmergency.length > 0 ? "warn" : "ok"}
              />
              <AlertRow
                label="Missing medical info"
                count={missingMedical.length}
                severity={missingMedical.length > 5 ? "info" : "ok"}
              />
              <AlertRow
                label="No shirt size selected"
                count={allRegs.filter((r) => !r.shirt_size).length}
                severity="info"
              />
            </CardContent>
          </Card>

          {/* ── Tasks ─────────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
                Open Tasks ({allTasks.length})
              </CardTitle>
              <Link href="/admin/tasks">
                <Button size="sm" variant="outline">Manage</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {allTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open tasks.</p>
              ) : (
                <div className="space-y-2">
                  {allTasks.slice(0, 8).map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <div className="flex items-center gap-2">
                        {task.priority === "urgent" || task.priority === "high" ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.due_date && (
                          <span className={`text-xs ${new Date(task.due_date) < new Date() ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {allTasks.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{allTasks.length - 8} more tasks
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Incidents ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Recent Incidents
              </CardTitle>
              <Link href="/admin/incidents">
                <Button size="sm" variant="outline">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {allIncidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incidents reported.</p>
              ) : (
                <div className="space-y-2">
                  {allIncidents.slice(0, 5).map((inc) => (
                    <div key={inc.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <div>
                        <span className="font-medium">{inc.title}</span>
                        {inc.event_id && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({eventMap.get(inc.event_id) ?? "Event"})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={inc.severity === "high" || inc.severity === "critical" ? "destructive" : inc.severity === "medium" ? "default" : "secondary"}>
                          {inc.severity}
                        </Badge>
                        {inc.resolved_at ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Volunteer Status ──────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-rose-500" />
                Volunteers
              </CardTitle>
              <Link href="/admin/volunteer-assignments">
                <Button size="sm" variant="outline">Assignments</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{allVolunteers.length}</p>
                  <p className="text-xs text-muted-foreground">Total Signups</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{allAssignments.length}</p>
                  <p className="text-xs text-muted-foreground">Assignments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {allAssignments.filter((a) => a.checked_in).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Logistics Checklist Summary ────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Logistics Status
              </CardTitle>
              <Link href="/admin/logistics">
                <Button size="sm" variant="outline">Full Checklist</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-amber-600">{logisticsTodo.length}</p>
                  <p className="text-xs text-muted-foreground">To Do</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{logisticsInProgress.length}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{logisticsDone.length}</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Sponsor Deliverables ──────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Handshake className="h-5 w-5 text-sky-600" />
                Sponsor Deliverables Due
              </CardTitle>
              <Link href="/admin/sponsor-deliverables">
                <Button size="sm" variant="outline">Manage</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {allDeliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending deliverables.</p>
              ) : (
                <div className="space-y-2">
                  {allDeliverables.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <div>
                        <span className="font-medium">{d.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({sponsorMap.get(d.sponsor_id) ?? "Sponsor"})
                        </span>
                      </div>
                      {d.due_date && (
                        <span className={`text-xs ${new Date(d.due_date) < new Date() ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                          {new Date(d.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Links ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/event-day"><Button size="sm">Event Day Command Center</Button></Link>
              <Link href="/admin/incidents"><Button size="sm" variant="outline">Report Incident</Button></Link>
              <Link href="/admin/tasks"><Button size="sm" variant="outline">Task Board</Button></Link>
              <Link href="/admin/logistics"><Button size="sm" variant="outline">Logistics Checklist</Button></Link>
              <Link href="/admin/aid-stations"><Button size="sm" variant="outline">Aid Stations</Button></Link>
              <Link href="/admin/sag"><Button size="sm" variant="outline">SAG Vehicles</Button></Link>
              <Link href="/admin/volunteer-assignments"><Button size="sm" variant="outline">Volunteer Assignments</Button></Link>
              <Link href="/admin/sponsor-deliverables"><Button size="sm" variant="outline">Sponsor Deliverables</Button></Link>
              <Link href="/admin/checkins"><Button size="sm" variant="outline">Check-in Photos</Button></Link>
              <Link href="/admin/exports"><Button size="sm" variant="outline">Export Data</Button></Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, goal, warn }: {
  label: string; value: number; goal?: number; warn?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className={`text-xl font-bold tabular-nums ${warn && value > 0 ? "text-amber-600" : ""}`}>
        {value}{goal ? ` / ${goal}` : ""}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AlertRow({ label, count, severity }: {
  label: string; count: number; severity: "ok" | "warn" | "info";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <Badge variant={severity === "warn" ? "destructive" : severity === "info" ? "secondary" : "outline"}>
        {count}
      </Badge>
    </div>
  );
}
