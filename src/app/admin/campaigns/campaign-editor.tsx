"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Send, Eye, FlaskConical } from "lucide-react";

interface CampaignEditorProps {
  campaign?: {
    id: string;
    subject: string;
    preview_text: string | null;
    body_html: string;
    tags_filter: string[];
    status: string;
  };
}

export function CampaignEditor({ campaign }: CampaignEditorProps) {
  const router = useRouter();
  const isEdit = !!campaign;

  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [previewText, setPreviewText] = useState(
    campaign?.preview_text ?? ""
  );
  const [bodyHtml, setBodyHtml] = useState(campaign?.body_html ?? "");
  const [tagsFilter, setTagsFilter] = useState(
    campaign?.tags_filter?.join(", ") ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!subject.trim() || !bodyHtml.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: campaign?.id,
          subject: subject.trim(),
          preview_text: previewText.trim() || null,
          body_html: bodyHtml.trim(),
          tags_filter: tagsFilter
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed.");
        setSaving(false);
        return;
      }
      router.push(`/admin/campaigns/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }

  async function handleSend() {
    if (!campaign?.id) return;
    if (!confirm("Send this campaign to all matching subscribers?")) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed.");
        setSending(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  async function handleTestSend() {
    if (!campaign?.id) return;
    const testEmail = prompt(
      "Send a test email to:",
      "miles@makingmilesmatter.com"
    );
    if (!testEmail) return;
    setTestSending(true);
    setError("");

    try {
      const res = await fetch("/api/admin/campaigns/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          testEmail: testEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Test send failed.");
        return;
      }
      alert(`Test email sent to ${testEmail}`);
    } catch {
      setError("Network error.");
    } finally {
      setTestSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Subject Line *</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., FFF Registration Now Open!"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Preview Text</label>
            <Input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Shows in inbox preview..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Audience Tags (comma separated, empty = all)
            </label>
            <Input
              value={tagsFilter}
              onChange={(e) => setTagsFilter(e.target.value)}
              placeholder="e.g., newsletter, riders"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Body (HTML)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showPreview ? (
            <div
              className="prose max-w-none rounded-lg border bg-white p-6"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : (
            <Textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
              rows={20}
              className="font-mono text-xs"
            />
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || !subject.trim() || !bodyHtml.trim()}
          className="gap-1"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : isEdit ? "Update Draft" : "Save Draft"}
        </Button>
        {isEdit && campaign.status === "draft" && (
          <>
            <Button
              onClick={handleTestSend}
              disabled={testSending}
              variant="outline"
              className="gap-1"
            >
              <FlaskConical className="h-4 w-4" />
              {testSending ? "Sending..." : "Send Test"}
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              variant="outline"
              className="gap-1"
              style={{ borderColor: "var(--brand-orange)", color: "var(--brand-orange)" }}
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send Now"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
