"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { isVotingOpen, JERSEY_VOTE_YEAR } from "@/lib/jersey-voting";

export interface DesignRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  year: number;
  active: boolean;
  created_at: string;
  voteCount: number;
}

export function JerseyAdminClient({
  designs,
  totalVotes,
  createAction,
  toggleActiveAction,
  deleteAction,
}: {
  designs: DesignRow[];
  totalVotes: number;
  createAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  toggleActiveAction: (id: string, active: boolean) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const votingOpen = isVotingOpen(JERSEY_VOTE_YEAR);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    setActionError(null);

    const form = e.currentTarget;
    const file = fileInputRef.current?.files?.[0];
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value.trim();
    const year = (form.elements.namedItem("year") as HTMLInputElement).value;

    if (!title) { setUploadError("Title is required."); return; }
    if (!file) { setUploadError("Please select an image."); return; }

    setUploading(true);
    let imageUrl = "";
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload-jersey", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      imageUrl = data.url as string;
    } catch {
      setUploadError("Network error during upload.");
      return;
    } finally {
      setUploading(false);
    }

    const submitFd = new FormData();
    submitFd.set("title", title);
    submitFd.set("description", description);
    submitFd.set("year", year);
    submitFd.set("image_url", imageUrl);

    startTransition(async () => {
      const result = await createAction(submitFd);
      if (result.ok) {
        formRef.current?.reset();
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowForm(false);
        router.refresh();
      } else {
        setActionError(result.error ?? "Failed to create design.");
      }
    });
  }

  function handleToggle(id: string, currentActive: boolean) {
    setActionError(null);
    startTransition(async () => {
      const result = await toggleActiveAction(id, !currentActive);
      if (result.ok) {
        router.refresh();
      } else {
        setActionError(result.error ?? "Failed to update design.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this design? This cannot be undone.")) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        setActionError(result.error ?? "Failed to delete design.");
      }
    });
  }

  function handleExportCsv() {
    window.open(`/api/admin/jersey-votes-csv?year=${JERSEY_VOTE_YEAR}`, "_blank");
  }

  return (
    <div className="space-y-8">
      {/* Stats header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg border px-4 py-2">
            <span className="text-muted-foreground">Total votes</span>
            <p className="text-xl font-bold">{totalVotes}</p>
          </div>
          <div className="rounded-lg border px-4 py-2">
            <span className="text-muted-foreground">Designs</span>
            <p className="text-xl font-bold">{designs.length}</p>
          </div>
          <div className="rounded-lg border px-4 py-2">
            <span className="text-muted-foreground">Voting status</span>
            <p className="text-xl font-bold">
              {votingOpen ? (
                <span className="text-green-600">Open</span>
              ) : (
                <span className="text-muted-foreground">Closed</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Design
          </Button>
        </div>
      </div>

      {/* Add design form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Jersey Design</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Classic Navy"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    defaultValue={JERSEY_VOTE_YEAR}
                    min={2020}
                    max={2099}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Optional description of the design…"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div>
                <Label htmlFor="image">Jersey Image *</Label>
                <input
                  id="image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG, WebP or GIF — max 10 MB
                </p>
              </div>

              {(uploadError || actionError) && (
                <p className="text-sm text-destructive">{uploadError ?? actionError}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={uploading || isPending}>
                  {uploading || isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Uploading…" : "Add Design"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowForm(false); setUploadError(null); setActionError(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {actionError && !showForm && (
        <p className="text-sm text-destructive">{actionError}</p>
      )}

      {/* Design grid */}
      {designs.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No designs yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => (
            <Card key={d.id} className={!d.active ? "opacity-60" : ""}>
              <div className="aspect-video overflow-hidden rounded-t-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image_url}
                  alt={d.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{d.title}</p>
                    {d.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{d.description}</p>
                    )}
                  </div>
                  <Badge variant={d.active ? "default" : "secondary"} className="shrink-0">
                    {d.active ? "Active" : "Hidden"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {d.voteCount} {d.voteCount === 1 ? "vote" : "votes"}
                  </span>
                  <span className="text-xs text-muted-foreground">Year {d.year}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => handleToggle(d.id, d.active)}
                  >
                    {d.active ? (
                      <><ToggleRight className="mr-1 h-3.5 w-3.5" /> Hide</>
                    ) : (
                      <><ToggleLeft className="mr-1 h-3.5 w-3.5" /> Show</>
                    )}
                  </Button>
                  {d.voteCount === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={isPending}
                      onClick={() => handleDelete(d.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
