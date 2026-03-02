"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { generateEmailDraftFromTemplate } from "../actions";

interface FollowupSponsor {
  id: string;
  name: string;
  status: string;
  next_followup_at: string | null;
  committed_amount: number | null;
  notes: string | null;
}

interface Contact {
  id: string;
  sponsor_id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Template {
  id: string;
  name: string;
  subject: string;
}

export function FollowupsClient({
  sponsors,
  contacts,
  templates,
}: {
  sponsors: FollowupSponsor[];
  contacts: Contact[];
  templates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [draftSponsorId, setDraftSponsorId] = useState<string | null>(null);
  const [draftTemplateId, setDraftTemplateId] = useState("");
  const [draftContactId, setDraftContactId] = useState("");

  function clearResult() {
    setTimeout(() => setResult(null), 3500);
  }

  const now = new Date();
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const overdue = sponsors.filter(
    (s) => s.next_followup_at && new Date(s.next_followup_at) < now
  );
  const upcoming = sponsors.filter((s) => {
    if (!s.next_followup_at) return false;
    const d = new Date(s.next_followup_at);
    return d >= now && d <= sevenDaysOut;
  });

  const contactsFor = (id: string) =>
    contacts.filter((c) => c.sponsor_id === id && c.email);

  function openDraftForm(sponsorId: string) {
    setDraftSponsorId(sponsorId);
    setDraftTemplateId(templates[0]?.id ?? "");
    const firstContact = contactsFor(sponsorId)[0];
    setDraftContactId(firstContact?.id ?? "");
  }

  function handleCreateDraft(sponsor: FollowupSponsor) {
    if (!draftTemplateId) return;
    const contact = contacts.find((c) => c.id === draftContactId);
    if (!contact?.email) return;
    startTransition(async () => {
      const res = await generateEmailDraftFromTemplate({
        sponsorId: sponsor.id,
        sponsorName: sponsor.name,
        committedAmount: sponsor.committed_amount ?? 0,
        contactName: contact.name,
        contactEmail: contact.email!,
        templateId: draftTemplateId,
      });
      if (res.ok) {
        setResult({ type: "success", message: `Draft created for ${sponsor.name}.` });
        clearResult();
        setDraftSponsorId(null);
        router.refresh();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  function renderSponsor(s: FollowupSponsor, isOverdue: boolean) {
    const d = s.next_followup_at ? new Date(s.next_followup_at) : null;
    const hasContacts = contactsFor(s.id).length > 0;
    const isExpanded = draftSponsorId === s.id;

    return (
      <div
        key={s.id}
        className={`rounded-lg border p-4 ${isOverdue ? "border-red-200 bg-red-50/30" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/admin/sponsors"
                className="font-medium hover:underline"
              >
                {s.name}
              </a>
              <Badge
                variant="secondary"
                className={`text-xs ${isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
              >
                {isOverdue ? "Overdue" : "Due soon"}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">
                {s.status}
              </span>
            </div>
            {d && (
              <p
                className={`mt-0.5 text-sm ${isOverdue ? "font-medium text-red-700" : "text-muted-foreground"}`}
              >
                {isOverdue ? "Was due" : "Due"}{" "}
                {d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {s.notes && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                {s.notes}
              </p>
            )}
          </div>
          {templates.length > 0 && hasContacts && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                isExpanded ? setDraftSponsorId(null) : openDraftForm(s.id)
              }
              disabled={isPending}
            >
              <FileText className="mr-1 h-3.5 w-3.5" />
              {isExpanded ? "Cancel" : "Create Draft"}
            </Button>
          )}
        </div>

        {/* Inline draft form */}
        {isExpanded && (
          <div className="mt-3 space-y-2 rounded-md border bg-background p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Template</label>
                <select
                  value={draftTemplateId}
                  onChange={(e) => setDraftTemplateId(e.target.value)}
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Contact</label>
                <select
                  value={draftContactId}
                  onChange={(e) => setDraftContactId(e.target.value)}
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                >
                  {contactsFor(s.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleCreateDraft(s)}
              disabled={isPending || !draftTemplateId || !draftContactId}
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
    );
  }

  const isEmpty = overdue.length === 0 && upcoming.length === 0;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <a
        href="/admin/sponsors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Sponsor CRM
      </a>

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

      {isEmpty && (
        <p className="py-16 text-center text-muted-foreground">
          No follow-ups due in the next 7 days.
        </p>
      )}

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-red-700">
            Overdue ({overdue.length})
          </h2>
          <div className="space-y-3">
            {overdue.map((s) => renderSponsor(s, true))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Next 7 Days ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map((s) => renderSponsor(s, false))}
          </div>
        </section>
      )}
    </div>
  );
}
