"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Phone,
  Mail,
  MessageSquare,
  Users,
  Calendar,
  LayoutGrid,
  List,
  ExternalLink,
  Trash2,
  Download,
  FileText,
} from "lucide-react";
import {
  addSponsor,
  updateSponsor,
  deleteSponsor,
  addContact,
  deleteContact,
  logInteraction,
  generateEmailDraft,
  generateEmailDraftFromTemplate,
  exportSponsorsCsv,
} from "./actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type SponsorStatus =
  | "prospect"
  | "contacted"
  | "negotiating"
  | "committed"
  | "paid"
  | "declined";

type InteractionType = "email" | "call" | "meeting" | "text";

interface Sponsor {
  id: string;
  name: string;
  website: string | null;
  address: string | null;
  status: SponsorStatus;
  expected_amount: number | null;
  committed_amount: number | null;
  notes: string | null;
  next_followup_at: string | null;
  owner_profile_id: string | null;
  created_at: string;
}

interface Contact {
  id: string;
  sponsor_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface Interaction {
  id: string;
  sponsor_id: string;
  type: InteractionType;
  summary: string;
  occurred_at: string;
  created_by: string | null;
}

interface SponsorTemplate {
  id: string;
  name: string;
  subject: string;
  body_markdown: string;
  tags: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUSES: SponsorStatus[] = [
  "prospect",
  "contacted",
  "negotiating",
  "committed",
  "paid",
  "declined",
];

const STATUS_COLORS: Record<SponsorStatus, string> = {
  prospect: "bg-gray-100 text-gray-700",
  contacted: "bg-blue-100 text-blue-700",
  negotiating: "bg-amber-100 text-amber-700",
  committed: "bg-emerald-100 text-emerald-700",
  paid: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

const INTERACTION_ICONS: Record<InteractionType, typeof Phone> = {
  email: Mail,
  call: Phone,
  meeting: Users,
  text: MessageSquare,
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function SponsorsClient({
  orgId,
  sponsors: initialSponsors,
  contacts: initialContacts,
  interactions: initialInteractions,
  templates: initialTemplates,
  pipelineTotal,
  pipelineGoal,
}: {
  orgId: string;
  sponsors: Sponsor[];
  contacts: Contact[];
  interactions: Interaction[];
  templates: SponsorTemplate[];
  pipelineTotal: number;
  pipelineGoal: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Quick-add form state
  const [addName, setAddName] = useState("");
  const [addWebsite, setAddWebsite] = useState("");
  const [addExpected, setAddExpected] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Detail drawer interaction form
  const [intType, setIntType] = useState<InteractionType>("email");
  const [intSummary, setIntSummary] = useState("");

  // Detail drawer contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [ctName, setCtName] = useState("");
  const [ctEmail, setCtEmail] = useState("");
  const [ctPhone, setCtPhone] = useState("");
  const [ctRole, setCtRole] = useState("");

  // Status update form in drawer
  const [editStatus, setEditStatus] = useState<SponsorStatus>("prospect");
  const [editCommitted, setEditCommitted] = useState("");
  const [editNextFollowup, setEditNextFollowup] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Export state
  const [exporting, setExporting] = useState(false);

  // Template draft state
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draftTemplateId, setDraftTemplateId] = useState("");
  const [draftContactId, setDraftContactId] = useState("");

  const sponsors = initialSponsors;
  const templates = initialTemplates;
  const contacts = initialContacts;
  const interactions = initialInteractions;

  const contactsFor = (id: string) => contacts.filter((c) => c.sponsor_id === id);
  const interactionsFor = (id: string) =>
    interactions
      .filter((i) => i.sponsor_id === id)
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      );

  function openDrawer(sponsor: Sponsor) {
    setSelectedSponsor(sponsor);
    setEditStatus(sponsor.status);
    setEditCommitted(String(sponsor.committed_amount ?? 0));
    setEditNextFollowup(
      sponsor.next_followup_at
        ? sponsor.next_followup_at.slice(0, 10)
        : ""
    );
    setEditNotes(sponsor.notes ?? "");
    setIntSummary("");
    setShowContactForm(false);
    setCtName("");
    setCtEmail("");
    setCtPhone("");
    setCtRole("");
    setDrawerOpen(true);
  }

  function clearResult() {
    setTimeout(() => setResult(null), 3000);
  }

  // ── Quick Add ──

  function handleQuickAdd() {
    if (!addName.trim()) return;
    setResult(null);
    startTransition(async () => {
      const res = await addSponsor({
        orgId,
        name: addName.trim(),
        website: addWebsite.trim() || undefined,
        expectedAmount: addExpected ? parseInt(addExpected) : undefined,
      });
      if (res.ok) {
        setAddName("");
        setAddWebsite("");
        setAddExpected("");
        setShowAddForm(false);
        setResult({ type: "success", message: `"${addName.trim()}" added.` });
        clearResult();
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  // ── Status Update ──

  function handleStatusUpdate() {
    if (!selectedSponsor) return;
    startTransition(async () => {
      const res = await updateSponsor(selectedSponsor.id, {
        status: editStatus,
        committedAmount: editCommitted ? parseInt(editCommitted) : 0,
        nextFollowupAt: editNextFollowup || null,
        notes: editNotes || undefined,
      });
      if (res.ok) {
        setResult({ type: "success", message: "Sponsor updated." });
        clearResult();
        router.refresh();
        setDrawerOpen(false);
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  // ── Delete Sponsor ──

  function handleDelete() {
    if (!selectedSponsor) return;
    if (!confirm(`Delete "${selectedSponsor.name}"? This cannot be undone.`))
      return;
    startTransition(async () => {
      const res = await deleteSponsor(selectedSponsor.id);
      if (res.ok) {
        setDrawerOpen(false);
        setResult({ type: "success", message: "Sponsor deleted." });
        clearResult();
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  // ── Log Interaction ──

  function handleLogInteraction() {
    if (!selectedSponsor || !intSummary.trim()) return;
    startTransition(async () => {
      const res = await logInteraction({
        sponsorId: selectedSponsor.id,
        type: intType,
        summary: intSummary.trim(),
      });
      if (res.ok) {
        setIntSummary("");
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  // ── Add Contact ──

  function handleAddContact() {
    if (!selectedSponsor || !ctName.trim()) return;
    startTransition(async () => {
      const res = await addContact({
        sponsorId: selectedSponsor.id,
        name: ctName.trim(),
        email: ctEmail.trim() || undefined,
        phone: ctPhone.trim() || undefined,
        role: ctRole.trim() || undefined,
      });
      if (res.ok) {
        setCtName("");
        setCtEmail("");
        setCtPhone("");
        setCtRole("");
        setShowContactForm(false);
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  // ── Delete Contact ──

  function handleDeleteContact(contactId: string) {
    startTransition(async () => {
      await deleteContact(contactId);
      router.refresh();
    });
  }

  // ── Generate Email Draft ──

  function handleEmailDraft(contact: Contact) {
    if (!selectedSponsor || !contact.email) return;
    startTransition(async () => {
      const res = await generateEmailDraft({
        sponsorId: selectedSponsor.id,
        sponsorName: selectedSponsor.name,
        contactName: contact.name,
        contactEmail: contact.email!,
      });
      if (res.ok) {
        setResult({
          type: "success",
          message: `Email draft created — view in Approvals.`,
        });
        clearResult();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  // ── Generate Draft from Template ──

  function handleDraftFromTemplate() {
    if (!selectedSponsor || !draftTemplateId) return;
    const contact = contacts.find((c) => c.id === draftContactId);
    if (!contact?.email) return;
    startTransition(async () => {
      const res = await generateEmailDraftFromTemplate({
        sponsorId: selectedSponsor.id,
        sponsorName: selectedSponsor.name,
        committedAmount: selectedSponsor.committed_amount ?? 0,
        contactName: contact.name,
        contactEmail: contact.email!,
        templateId: draftTemplateId,
      });
      if (res.ok) {
        setResult({
          type: "success",
          message: `Draft created from template — view in Approvals.`,
        });
        clearResult();
        setShowDraftForm(false);
        setDraftTemplateId("");
        setDraftContactId("");
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  // ── Export ──

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportSponsorsCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sponsors-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setResult({ type: "error", message: "Export failed" });
    } finally {
      setExporting(false);
    }
  }

  // ── Follow-ups ──

  const now = new Date();
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const upcomingFollowups = sponsors
    .filter((s) => s.next_followup_at && s.status !== "declined" && s.status !== "paid")
    .sort(
      (a, b) =>
        new Date(a.next_followup_at!).getTime() -
        new Date(b.next_followup_at!).getTime()
    )
    .filter(
      (s) => new Date(s.next_followup_at!).getTime() <= sevenDaysOut.getTime()
    );

  // ── Pipeline summary ──

  const pipeline = STATUSES.map((status) => {
    const group = sponsors.filter((s) => s.status === status);
    const total = group.reduce((sum, s) => sum + (s.expected_amount ?? 0), 0);
    return { status, sponsors: group, total };
  });

  const totalExpected = sponsors.reduce(
    (sum, s) => sum + (s.expected_amount ?? 0),
    0
  );
  const totalCommitted = sponsors.reduce(
    (sum, s) => sum + (s.committed_amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Feedback */}
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

      {/* Pipeline Progress Bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Pipeline Goal</span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              ${pipelineTotal.toLocaleString()}
            </span>
            {" / "}${pipelineGoal.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${Math.min(100, (pipelineTotal / pipelineGoal) * 100).toFixed(1)}%`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {((pipelineTotal / pipelineGoal) * 100).toFixed(0)}% of goal —
          committed + paid sponsors only.{" "}
          <a href="/admin/sponsors/followups" className="text-primary underline-offset-2 hover:underline">
            View follow-ups
          </a>
          {" · "}
          <a href="/admin/sponsors/templates" className="text-primary underline-offset-2 hover:underline">
            Manage templates
          </a>
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Sponsor
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="mr-1.5 h-4 w-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
        <div className="ml-auto flex gap-1">
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="sponsor-name">Name *</Label>
                <Input
                  id="sponsor-name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Business name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sponsor-website">Website</Label>
                <Input
                  id="sponsor-website"
                  value={addWebsite}
                  onChange={(e) => setAddWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sponsor-expected">Expected $</Label>
                <Input
                  id="sponsor-expected"
                  type="number"
                  value={addExpected}
                  onChange={(e) => setAddExpected(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={isPending || !addName.trim()}
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                Add
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

      {/* Pipeline Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Total Sponsors</p>
            <p className="text-2xl font-bold">{sponsors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
            <p className="text-2xl font-bold">
              ${totalExpected.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Committed</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${totalCommitted.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Follow-ups Due</p>
            <p className="text-2xl font-bold text-amber-600">
              {upcomingFollowups.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up List */}
      {upcomingFollowups.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-amber-600" />
              Upcoming Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingFollowups.map((s) => {
                const d = new Date(s.next_followup_at!);
                const overdue = d < now;
                return (
                  <button
                    key={s.id}
                    onClick={() => openDrawer(s)}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <Badge
                          className={`mr-2 ${STATUS_COLORS[s.status]}`}
                          variant="secondary"
                        >
                          {s.status}
                        </Badge>
                        ${(s.expected_amount ?? 0).toLocaleString()} expected
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        overdue ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {overdue ? "Overdue" : ""}{" "}
                      {d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {pipeline.map(({ status, sponsors: group, total }) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={STATUS_COLORS[status]} variant="secondary">
                  {status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {group.length}
                </span>
              </div>
              {total > 0 && (
                <p className="text-xs text-muted-foreground">
                  ${total.toLocaleString()}
                </p>
              )}
              <div className="space-y-2">
                {group.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openDrawer(s)}
                    className="w-full rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="text-sm font-medium">{s.name}</p>
                    {(s.expected_amount ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ${(s.expected_amount ?? 0).toLocaleString()}
                      </p>
                    )}
                    {s.next_followup_at && (
                      <p
                        className={`mt-1 text-xs ${
                          new Date(s.next_followup_at) < now
                            ? "text-red-600 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        Follow-up:{" "}
                        {new Date(s.next_followup_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    )}
                  </button>
                ))}
                {group.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Empty
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <Card>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Expected
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      Committed
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Follow-up
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Contacts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sponsors.map((s) => (
                    <tr
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDrawer(s)}
                    >
                      <td className="px-4 py-2 font-medium">{s.name}</td>
                      <td className="px-4 py-2">
                        <Badge
                          className={STATUS_COLORS[s.status]}
                          variant="secondary"
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        ${(s.expected_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        ${(s.committed_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        {s.next_followup_at ? (
                          <span
                            className={
                              new Date(s.next_followup_at) < now
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {new Date(s.next_followup_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {contactsFor(s.id).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sponsors.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No sponsors yet. Add one above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selectedSponsor && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedSponsor.name}
                  {selectedSponsor.website && (
                    <a
                      href={selectedSponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status + Details */}
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Status</Label>
                      <select
                        value={editStatus}
                        onChange={(e) =>
                          setEditStatus(e.target.value as SponsorStatus)
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Committed $</Label>
                      <Input
                        type="number"
                        value={editCommitted}
                        onChange={(e) => setEditCommitted(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Next Follow-up</Label>
                    <Input
                      type="date"
                      value={editNextFollowup}
                      onChange={(e) => setEditNextFollowup(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleStatusUpdate}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Contacts */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Contacts</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowContactForm(!showContactForm)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>

                  {showContactForm && (
                    <div className="mb-3 space-y-2 rounded-lg border p-3">
                      <Input
                        placeholder="Name *"
                        value={ctName}
                        onChange={(e) => setCtName(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Email"
                          value={ctEmail}
                          onChange={(e) => setCtEmail(e.target.value)}
                        />
                        <Input
                          placeholder="Phone"
                          value={ctPhone}
                          onChange={(e) => setCtPhone(e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Role (e.g. Marketing Director)"
                        value={ctRole}
                        onChange={(e) => setCtRole(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddContact}
                        disabled={isPending || !ctName.trim()}
                      >
                        Add Contact
                      </Button>
                    </div>
                  )}

                  {contactsFor(selectedSponsor.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No contacts yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {contactsFor(selectedSponsor.id).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start justify-between rounded-lg border p-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            {c.role && (
                              <p className="text-xs text-muted-foreground">
                                {c.role}
                              </p>
                            )}
                            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                              {c.email && <span>{c.email}</span>}
                              {c.phone && <span>{c.phone}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {c.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEmailDraft(c)}
                                disabled={isPending}
                                title="Generate email draft"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContact(c.id)}
                              disabled={isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generate Email Draft from Template */}
                {templates.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Generate Email Draft</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDraftForm(!showDraftForm)}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {showDraftForm ? "Cancel" : "From Template"}
                      </Button>
                    </div>
                    {showDraftForm && (
                      <div className="space-y-2 rounded-lg border p-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Template</Label>
                          <select
                            value={draftTemplateId}
                            onChange={(e) => setDraftTemplateId(e.target.value)}
                            className="w-full rounded-md border px-2 py-1.5 text-sm"
                          >
                            <option value="">Select a template…</option>
                            {templates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {contactsFor(selectedSponsor!.id).filter((c) => c.email).length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs">Contact</Label>
                            <select
                              value={draftContactId}
                              onChange={(e) => setDraftContactId(e.target.value)}
                              className="w-full rounded-md border px-2 py-1.5 text-sm"
                            >
                              <option value="">Select contact…</option>
                              {contactsFor(selectedSponsor!.id)
                                .filter((c) => c.email)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.email})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={handleDraftFromTemplate}
                          disabled={
                            isPending ||
                            !draftTemplateId ||
                            (!draftContactId &&
                              contactsFor(selectedSponsor!.id).filter((c) => c.email).length > 0)
                          }
                        >
                          {isPending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="mr-1.5 h-4 w-4" />
                          )}
                          Create Draft
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Log Interaction */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Log Interaction
                  </h3>
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {(
                        ["email", "call", "meeting", "text"] as InteractionType[]
                      ).map((t) => {
                        const Icon = INTERACTION_ICONS[t];
                        return (
                          <Button
                            key={t}
                            variant={intType === t ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIntType(t)}
                          >
                            <Icon className="mr-1 h-3 w-3" />
                            {t}
                          </Button>
                        );
                      })}
                    </div>
                    <Textarea
                      placeholder="Summary of the interaction..."
                      value={intSummary}
                      onChange={(e) => setIntSummary(e.target.value)}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      onClick={handleLogInteraction}
                      disabled={isPending || !intSummary.trim()}
                    >
                      Log
                    </Button>
                  </div>
                </div>

                {/* Interaction History */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold">History</h3>
                  {interactionsFor(selectedSponsor.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No interactions logged yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {interactionsFor(selectedSponsor.id).map((i) => {
                        const Icon = INTERACTION_ICONS[i.type];
                        return (
                          <div
                            key={i.id}
                            className="flex gap-3 rounded-lg border p-2"
                          >
                            <div className="mt-0.5">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">{i.summary}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(i.occurred_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
