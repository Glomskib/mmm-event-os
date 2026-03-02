"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, Loader2, Image as ImageIcon } from "lucide-react";

interface CheckinItem {
  id: string;
  photoUrl: string | null;
  userName: string;
  userEmail: string;
  rideName: string;
  rideDate: string;
}

export function ModerationClient({
  checkins,
  approveAction,
  rejectAction,
  bulkApproveAction,
  mode,
}: {
  checkins: CheckinItem[];
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
  bulkApproveAction: (formData: FormData) => Promise<void>;
  mode: "pending" | "approved";
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [actioningId, setActioningId] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === checkins.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(checkins.map((c) => c.id)));
    }
  }

  function handleApprove(id: string) {
    setActioningId(id);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await approveAction(fd);
      setActioningId(null);
      router.refresh();
    });
  }

  function handleReject(id: string) {
    if (!confirm("Reject and delete this check-in?")) return;
    setActioningId(id);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await rejectAction(fd);
      setActioningId(null);
      router.refresh();
    });
  }

  function handleBulkApprove() {
    if (selected.size === 0) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ids", JSON.stringify([...selected]));
      await bulkApproveAction(fd);
      setSelected(new Set());
      router.refresh();
    });
  }

  if (checkins.length === 0) {
    return (
      <div className="py-12 text-center">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">
          {mode === "pending" ? "No pending check-ins" : "No approved check-ins"}
        </h3>
      </div>
    );
  }

  return (
    <div>
      {mode === "pending" && checkins.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selected.size === checkins.length ? "Deselect All" : "Select All"}
          </Button>
          {selected.size > 0 && (
            <Button size="sm" onClick={handleBulkApprove} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve Selected ({selected.size})
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checkins.map((checkin) => (
          <Card
            key={checkin.id}
            className={`overflow-hidden ${
              mode === "pending" && selected.has(checkin.id)
                ? "ring-2 ring-primary"
                : ""
            }`}
          >
            {/* Photo */}
            {checkin.photoUrl ? (
              <div
                className={`relative aspect-video cursor-pointer bg-muted`}
                onClick={() => mode === "pending" && toggleSelect(checkin.id)}
              >
                <img
                  src={checkin.photoUrl}
                  alt={`${checkin.userName}'s ride photo`}
                  className="h-full w-full object-cover"
                />
                {mode === "pending" && (
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selected.has(checkin.id)}
                      onChange={() => toggleSelect(checkin.id)}
                      className="h-5 w-5 rounded"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">
                {checkin.userName}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{checkin.userEmail}</p>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{checkin.rideName}</p>
                  <p className="text-xs text-muted-foreground">
                    {checkin.rideDate &&
                      new Date(checkin.rideDate + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                  </p>
                </div>
                {mode === "approved" && (
                  <Badge variant="default">Approved</Badge>
                )}
              </div>

              {mode === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleApprove(checkin.id)}
                    disabled={isPending && actioningId === checkin.id}
                  >
                    {isPending && actioningId === checkin.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(checkin.id)}
                    disabled={isPending && actioningId === checkin.id}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
