"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, X, Upload } from "lucide-react";
import { createDraft } from "./actions";
import type { GeneratedDraft, TemplateInput } from "@/lib/social-templates";
import { generateSocialDrafts } from "@/lib/social-templates";

const CHANNELS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "twitter", label: "X (Twitter)" },
] as const;

export function SocialFormClient({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [channels, setChannels] = useState<Record<string, boolean>>({});
  const [scheduledFor, setScheduledFor] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedDraft[]>([]);

  // Template generator state
  const [templateInput, setTemplateInput] = useState<TemplateInput>({
    eventName: "",
    date: "",
    distance: "",
    registrationUrl: "",
    topic: "Making Miles Matter",
  });
  const [showGenerator, setShowGenerator] = useState(false);

  function toggleChannel(key: string) {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/upload-social", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        } else {
          console.error("Upload failed:", data.error);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setMediaUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);
    // Reset the input
    e.target.value = "";
  }

  function removeImage(index: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleGenerateDrafts() {
    const drafts = generateSocialDrafts(templateInput);
    setGeneratedDrafts(drafts);
  }

  function useDraft(draft: GeneratedDraft) {
    setPostText(draft.text);
    if (!title) {
      setTitle(
        `${templateInput.eventName || "Social Post"} — ${draft.label}`
      );
    }
    setGeneratedDrafts([]);
    setShowGenerator(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !postText.trim()) {
      setResult({ ok: false, message: "Title and post text are required." });
      return;
    }

    const selectedChannels = Object.entries(channels).filter(([, v]) => v);
    if (selectedChannels.length === 0) {
      setResult({
        ok: false,
        message: "Select at least one channel.",
      });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await createDraft({
        orgId,
        title: title.trim(),
        postText: postText.trim(),
        channelTargets: channels,
        scheduledFor: scheduledFor || null,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
      });

      if (res.ok) {
        setResult({
          ok: true,
          message: "Draft created! Redirecting to approvals...",
        });
        setTimeout(() => router.push("/admin/approvals"), 1500);
      } else {
        setResult({ ok: false, message: res.error ?? "Failed to create draft" });
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Social Draft</CardTitle>
            <CardDescription>
              Create a post draft. It will go through the approval queue before
              publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spring Ride Announcement"
                  className="mt-1"
                />
              </div>

              {/* Post text */}
              <div>
                <Label htmlFor="post-text">Post Text</Label>
                <textarea
                  id="post-text"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Write your social post here..."
                  rows={6}
                  className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {postText.length} characters
                </p>
              </div>

              {/* Channel targets */}
              <div>
                <Label>Channels</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {CHANNELS.map((ch) => (
                    <label
                      key={ch.key}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={!!channels[ch.key]}
                        onChange={() => toggleChannel(ch.key)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{ch.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scheduled for */}
              <div>
                <Label htmlFor="scheduled-for">
                  Schedule (optional)
                </Label>
                <Input
                  id="scheduled-for"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="mt-1 max-w-xs"
                />
              </div>

              {/* Image uploads */}
              <div>
                <Label>Images (optional)</Label>
                <div className="mt-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Add Images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {mediaUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="group relative">
                        <img
                          src={url}
                          alt={`Upload ${i + 1}`}
                          className="h-20 w-20 rounded-md border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={submitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Creating..." : "Create Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGenerator(!showGenerator)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Drafts
                </Button>
              </div>

              {/* Result feedback */}
              {result && (
                <div
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    result.ok
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {result.message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar — Generator + Preview */}
      <div className="space-y-6">
        {/* Live preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {postText ? (
              <div className="space-y-3">
                <div className="whitespace-pre-wrap rounded-lg border bg-white p-3 text-sm">
                  {postText}
                </div>
                {mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mediaUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Preview ${i + 1}`}
                        className="h-16 w-16 rounded border object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {CHANNELS.filter((ch) => channels[ch.key]).map((ch) => (
                    <Badge key={ch.key} variant="secondary">
                      {ch.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start typing to see a preview.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Template generator */}
        {showGenerator && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Draft Generator</CardTitle>
              <CardDescription>
                Fill in details to generate 3 post variants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tpl-event">Event Name</Label>
                <Input
                  id="tpl-event"
                  value={templateInput.eventName}
                  onChange={(e) =>
                    setTemplateInput((p) => ({
                      ...p,
                      eventName: e.target.value,
                    }))
                  }
                  placeholder="Spring Century Ride"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tpl-date">Date</Label>
                <Input
                  id="tpl-date"
                  value={templateInput.date}
                  onChange={(e) =>
                    setTemplateInput((p) => ({ ...p, date: e.target.value }))
                  }
                  placeholder="May 17th"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tpl-distance">Distance(s)</Label>
                <Input
                  id="tpl-distance"
                  value={templateInput.distance}
                  onChange={(e) =>
                    setTemplateInput((p) => ({
                      ...p,
                      distance: e.target.value,
                    }))
                  }
                  placeholder="25, 50, 100 miles"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tpl-url">Registration URL</Label>
                <Input
                  id="tpl-url"
                  value={templateInput.registrationUrl}
                  onChange={(e) =>
                    setTemplateInput((p) => ({
                      ...p,
                      registrationUrl: e.target.value,
                    }))
                  }
                  placeholder="makingmilesmatter.com"
                  className="mt-1"
                />
              </div>

              <Button
                type="button"
                onClick={handleGenerateDrafts}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate 3 Variants
              </Button>

              {generatedDrafts.length > 0 && (
                <div className="space-y-3 pt-2">
                  {generatedDrafts.map((draft) => (
                    <div
                      key={draft.variant}
                      className="rounded-lg border p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant="outline">{draft.label}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => useDraft(draft)}
                        >
                          Use this
                        </Button>
                      </div>
                      <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                        {draft.text.slice(0, 200)}
                        {draft.text.length > 200 ? "..." : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
