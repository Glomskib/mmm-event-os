"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  EyeOff,
  Eye,
  Upload,
  Link2,
  ImageOff,
} from "lucide-react";
import type { MediaAsset } from "@/lib/media";
import {
  createMediaAsset,
  addEmbedAsset,
  updateMediaAsset,
  toggleMediaActive,
  deleteMediaAsset,
  moveMediaAsset,
} from "./actions";

type PlacementTab =
  | "hero"
  | "gallery"
  | "section"
  | "banner"
  | "hero_secondary"
  | "route_preview"
  | "testimonial"
  | "inline_section"
  | "background_loop"
  | "sponsor_showcase";

const PLACEMENT_LABELS: Record<PlacementTab, string> = {
  hero: "Hero",
  gallery: "Gallery",
  section: "Highlights",
  banner: "Banner",
  hero_secondary: "Hero 2nd",
  route_preview: "Route",
  testimonial: "Testimonial",
  inline_section: "Inline",
  background_loop: "BG Loop",
  sponsor_showcase: "Sponsors",
};

interface Props {
  events: Array<{ id: string; title: string; status: string }>;
  selectedEventId: string | null;
  initialMedia: MediaAsset[];
}

export function MediaClient({ events, selectedEventId, initialMedia }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PlacementTab>("gallery");
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Upload form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");

  // Embed form state
  const [embedUrl, setEmbedUrl] = useState("");
  const [embedTitle, setEmbedTitle] = useState("");
  const [embedCaption, setEmbedCaption] = useState("");
  const [embedPlacement, setEmbedPlacement] = useState<PlacementTab>("section");
  const [showExtendedTabs, setShowExtendedTabs] = useState(false);
  const [showEmbedForm, setShowEmbedForm] = useState(false);

  const eventId = selectedEventId;

  function handleEventChange(id: string) {
    const params = new URLSearchParams({ event_id: id });
    router.push(`/admin/media?${params}`);
  }

  const tabAssets = media.filter((a) => a.placement === activeTab);

  async function handleUpload() {
    if (!eventId || !fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("entity_id", eventId);
      formData.set("placement", activeTab);

      const res = await fetch("/api/admin/upload-media", {
        method: "POST",
        body: formData,
      });

      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* empty */ }

      if (!res.ok) {
        setUploadError((data.error as string) ?? `Upload failed (${res.status})`);
        return;
      }

      const result = await createMediaAsset({
        entityId: eventId,
        kind: (data.kind as "image" | "video") ?? "image",
        placement: activeTab,
        url: data.url as string,
        title: uploadTitle || undefined,
        caption: uploadCaption || undefined,
      });

      if (!result.ok) {
        setUploadError(result.error ?? "Failed to save asset");
        return;
      }

      // Reset form
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadTitle("");
      setUploadCaption("");

      router.refresh();
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAddEmbed() {
    if (!eventId || !embedUrl.trim()) return;
    startTransition(async () => {
      const result = await addEmbedAsset({
        entityId: eventId,
        placement: embedPlacement,
        url: embedUrl.trim(),
        title: embedTitle || undefined,
        caption: embedCaption || undefined,
      });
      if (result.ok) {
        setEmbedUrl("");
        setEmbedTitle("");
        setEmbedCaption("");
        setShowEmbedForm(false);
        router.refresh();
      }
    });
  }

  async function handleToggleActive(asset: MediaAsset) {
    startTransition(async () => {
      await toggleMediaActive(asset.id, !asset.is_active);
      setMedia((prev) =>
        prev.map((a) =>
          a.id === asset.id ? { ...a, is_active: !a.is_active } : a
        )
      );
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteMediaAsset(id);
      setMedia((prev) => prev.filter((a) => a.id !== id));
    });
  }

  async function handleMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveMediaAsset(id, direction);
      router.refresh();
    });
  }

  async function handleUpdateField(
    id: string,
    field: "title" | "caption",
    value: string
  ) {
    await updateMediaAsset(id, { [field]: value || null });
    router.refresh();
  }

  if (!eventId || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No events found. Create a draft or published event first.
        </CardContent>
      </Card>
    );
  }

  const selectedEvent = events.find((e) => e.id === eventId);

  return (
    <div className="space-y-6">
      {/* Event selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={eventId}
            onChange={(e) => handleEventChange(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/50 focus:border-ring"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.status})
              </option>
            ))}
          </select>
          {selectedEvent && (
            <p className="mt-1 text-xs text-muted-foreground">
              ID: {eventId}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Placement tabs */}
      <div className="space-y-1">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {(["hero", "gallery", "section", "banner"] as PlacementTab[]).map((tab) => {
            const count = media.filter((a) => a.placement === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {PLACEMENT_LABELS[tab]}
                {count > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setShowExtendedTabs((v) => !v)}
            className="rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="More placements"
          >
            {showExtendedTabs ? "▲" : "▼"}
          </button>
        </div>

        {showExtendedTabs && (
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {(["hero_secondary", "route_preview", "testimonial", "inline_section", "background_loop", "sponsor_showcase"] as PlacementTab[]).map((tab) => {
              const count = media.filter((a) => a.placement === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PLACEMENT_LABELS[tab]}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upload + Embed forms — left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* File upload card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Upload to {PLACEMENT_LABELS[activeTab]}
              </CardTitle>
              <CardDescription>JPEG, PNG, WebP, GIF, MP4, WebM · max 25 MB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary-foreground"
              />
              <Input
                placeholder="Title (optional)"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
              <Input
                placeholder="Caption (optional)"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
              />
              {uploadError && (
                <p className="text-xs text-red-600">{uploadError}</p>
              )}
              <Button
                size="sm"
                className="w-full"
                onClick={handleUpload}
                disabled={uploading || isPending}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </CardContent>
          </Card>

          {/* Embed / link card */}
          <Card>
            <CardHeader>
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setShowEmbedForm((v) => !v)}
              >
                <CardTitle className="text-sm">Add Embed / Link</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {showEmbedForm ? "▲" : "▼"}
                </span>
              </button>
              <CardDescription>YouTube, Vimeo, or direct URL</CardDescription>
            </CardHeader>
            {showEmbedForm && (
              <CardContent className="space-y-3">
                <Input
                  placeholder="https://www.youtube.com/embed/..."
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                />
                <Input
                  placeholder="Title (optional)"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                />
                <Input
                  placeholder="Caption (optional)"
                  value={embedCaption}
                  onChange={(e) => setEmbedCaption(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Placement</label>
                  <select
                    value={embedPlacement}
                    onChange={(e) =>
                      setEmbedPlacement(e.target.value as PlacementTab)
                    }
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-[3px] focus:ring-ring/50 focus:border-ring"
                  >
                    <option value="hero">Hero</option>
                    <option value="gallery">Gallery</option>
                    <option value="section">Highlights</option>
                    <option value="banner">Banner</option>
                    <option value="hero_secondary">Hero 2nd</option>
                    <option value="route_preview">Route</option>
                    <option value="testimonial">Testimonial</option>
                    <option value="inline_section">Inline</option>
                    <option value="background_loop">BG Loop</option>
                    <option value="sponsor_showcase">Sponsors</option>
                  </select>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleAddEmbed}
                  disabled={!embedUrl.trim() || isPending}
                >
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Add Embed
                </Button>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Asset list — right column */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {PLACEMENT_LABELS[activeTab]} — {tabAssets.length} asset
                {tabAssets.length !== 1 ? "s" : ""}
              </CardTitle>
              {activeTab === "hero" && (
                <CardDescription>
                  Only the first active asset is shown as the hero.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {tabAssets.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <ImageOff className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  No assets yet. Upload a file or add an embed.
                </div>
              ) : (
                <div className="space-y-3">
                  {tabAssets.map((asset, idx) => (
                    <AssetRow
                      key={asset.id}
                      asset={asset}
                      isFirst={idx === 0}
                      isLast={idx === tabAssets.length - 1}
                      onToggleActive={() => handleToggleActive(asset)}
                      onDelete={() => handleDelete(asset.id)}
                      onMoveUp={() => handleMove(asset.id, "up")}
                      onMoveDown={() => handleMove(asset.id, "down")}
                      onUpdateField={handleUpdateField}
                      disabled={isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── AssetRow ──────────────────────────────────────────────────────────────

interface AssetRowProps {
  asset: MediaAsset;
  isFirst: boolean;
  isLast: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateField: (id: string, field: "title" | "caption", value: string) => void;
  disabled: boolean;
}

function AssetRow({
  asset,
  isFirst,
  isLast,
  onToggleActive,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUpdateField,
  disabled,
}: AssetRowProps) {
  const [editTitle, setEditTitle] = useState(asset.title ?? "");
  const [editCaption, setEditCaption] = useState(asset.caption ?? "");

  const thumbSrc = asset.thumb_url ?? (asset.kind === "image" ? asset.url : null);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-3 py-3 ${
        !asset.is_active ? "opacity-60" : ""
      }`}
    >
      {/* Thumbnail */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={asset.title ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {asset.kind === "video" ? "🎬" : asset.kind === "embed" ? "📺" : "📷"}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <StatusBadge
            status={asset.kind}
            className="text-[10px] px-1.5 py-0"
          />
          {!asset.is_active && (
            <span className="text-[10px] text-muted-foreground">hidden</span>
          )}
        </div>
        <input
          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-medium text-foreground focus:border-border focus:bg-card focus:outline-none"
          placeholder="Title…"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => onUpdateField(asset.id, "title", editTitle)}
        />
        <input
          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-muted-foreground focus:border-border focus:bg-card focus:outline-none"
          placeholder="Caption…"
          value={editCaption}
          onChange={(e) => setEditCaption(e.target.value)}
          onBlur={() => onUpdateField(asset.id, "caption", editCaption)}
        />
        <p className="truncate text-[10px] text-muted-foreground/60">
          {asset.url}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-1">
        <div className="flex gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst || disabled}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast || disabled}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggleActive}
            disabled={disabled}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title={asset.is_active ? "Hide" : "Show"}
          >
            {asset.is_active ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={disabled}
            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
