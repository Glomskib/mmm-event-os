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
  CardDescription,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { addTemplate, updateTemplate, deleteTemplate } from "../actions";

interface Template {
  id: string;
  org_id: string;
  name: string;
  subject: string;
  body_markdown: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const PLACEHOLDER_VARS = ["{{sponsor_name}}", "{{contact_name}}", "{{committed_amount}}", "{{org_name}}"];

const DEFAULT_BODY = `Hi {{contact_name}},

I'm reaching out on behalf of {{org_name}} about a sponsorship opportunity for our upcoming events.

We'd love to explore how {{sponsor_name}} could partner with us to support our mission. Your investment of {{committed_amount}} would make a real difference.

Would you be available for a brief call this week?

Best regards,
The MMM Team`;

export function TemplatesClient({
  orgId: _orgId,
  templates: initialTemplates,
}: {
  orgId: string;
  templates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState(initialTemplates);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Create/edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState(DEFAULT_BODY);
  const [formTags, setFormTags] = useState("");

  function clearResult() {
    setTimeout(() => setResult(null), 3500);
  }

  function startCreate() {
    setEditingId(null);
    setFormName("");
    setFormSubject("");
    setFormBody(DEFAULT_BODY);
    setFormTags("");
    setShowForm(true);
  }

  function startEdit(t: Template) {
    setEditingId(t.id);
    setFormName(t.name);
    setFormSubject(t.subject);
    setFormBody(t.body_markdown);
    setFormTags(t.tags.join(", "));
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function handleSave() {
    if (!formName.trim() || !formSubject.trim() || !formBody.trim()) return;
    const tags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      if (editingId) {
        const res = await updateTemplate(editingId, {
          name: formName.trim(),
          subject: formSubject.trim(),
          bodyMarkdown: formBody.trim(),
          tags,
        });
        if (res.ok) {
          setResult({ type: "success", message: "Template updated." });
          clearResult();
          setShowForm(false);
          router.refresh();
        } else {
          setResult({ type: "error", message: res.error ?? "Failed" });
        }
      } else {
        const res = await addTemplate({
          name: formName.trim(),
          subject: formSubject.trim(),
          bodyMarkdown: formBody.trim(),
          tags,
        });
        if (res.ok) {
          setResult({ type: "success", message: "Template created." });
          clearResult();
          setShowForm(false);
          router.refresh();
        } else {
          setResult({ type: "error", message: res.error ?? "Failed" });
        }
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteTemplate(id);
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setResult({ type: "success", message: "Template deleted." });
        clearResult();
      } else {
        setResult({ type: "error", message: res.error ?? "Failed" });
      }
    });
  }

  return (
    <div className="space-y-6">
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

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Merge variables:{" "}
            {PLACEHOLDER_VARS.map((v) => (
              <code
                key={v}
                className="mx-0.5 rounded bg-muted px-1 py-0.5 text-xs font-mono"
              >
                {v}
              </code>
            ))}
          </p>
        </div>
        <Button size="sm" onClick={startCreate} disabled={showForm}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "Edit Template" : "New Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Initial Outreach"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject Line</Label>
              <Input
                placeholder="e.g. Sponsorship opportunity — {{org_name}}"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body (Markdown)</Label>
              <Textarea
                rows={10}
                placeholder="Email body…"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g. initial, follow-up, thank-you"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={
                  isPending ||
                  !formName.trim() ||
                  !formSubject.trim() ||
                  !formBody.trim()
                }
              >
                {isPending ? "Saving…" : editingId ? "Save Changes" : "Create Template"}
              </Button>
              <Button variant="outline" size="sm" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template List */}
      {templates.length === 0 && !showForm ? (
        <p className="py-16 text-center text-muted-foreground">
          No templates yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <CardDescription className="mt-0.5 font-mono text-xs">
                      {t.subject}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(t)}
                      disabled={showForm}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(t.id, t.name)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs text-muted-foreground">
                  {t.body_markdown}
                </pre>
                {t.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
