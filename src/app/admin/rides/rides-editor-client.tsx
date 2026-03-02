"use client";

import { useState, useTransition } from "react";
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
import { ChevronDown, ChevronUp, Loader2, Save } from "lucide-react";

interface SeriesItem {
  id: string;
  title: string;
  dayName: string;
  time: string;
  difficulty: "easy" | "moderate" | "hard";
  meet_location: string | null;
  route_ridewithgps_url: string | null;
  route_strava_url: string | null;
  route_wahoo_url: string | null;
  notes: string | null;
}

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  easy: "secondary",
  moderate: "default",
  hard: "destructive",
};

export function RidesEditorClient({
  series,
  updateAction,
}: {
  series: SeriesItem[];
  updateAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  function handleSave(id: string, form: HTMLFormElement) {
    setSavingId(id);
    startTransition(async () => {
      const fd = new FormData(form);
      fd.set("id", id);
      await updateAction(fd);
      setSavingId(null);
      router.refresh();
    });
  }

  if (series.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-lg font-medium text-muted-foreground">
          No ride series found
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create ride series in the database first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {series.map((s) => {
        const isExpanded = expandedId === s.id;
        const isSaving = isPending && savingId === s.id;

        // Format time
        const [h, m] = s.time.split(":");
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        const timeStr = `${displayHour}:${m} ${ampm}`;

        return (
          <Card key={s.id}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <Badge variant={DIFFICULTY_VARIANT[s.difficulty] ?? "default"}>
                    {s.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    {s.dayName} &middot; {timeStr}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent>
                <form
                  id={`form-${s.id}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave(s.id, e.currentTarget);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor={`meet-${s.id}`}>Meet Location</Label>
                    <Input
                      id={`meet-${s.id}`}
                      name="meet_location"
                      defaultValue={s.meet_location ?? ""}
                      placeholder="e.g. Parking lot behind Main St Coffee"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`rwgps-${s.id}`}>RideWithGPS URL</Label>
                    <Input
                      id={`rwgps-${s.id}`}
                      name="route_ridewithgps_url"
                      defaultValue={s.route_ridewithgps_url ?? ""}
                      placeholder="https://ridewithgps.com/routes/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor={`strava-${s.id}`}>Strava Route URL</Label>
                    <Input
                      id={`strava-${s.id}`}
                      name="route_strava_url"
                      defaultValue={s.route_strava_url ?? ""}
                      placeholder="https://www.strava.com/routes/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor={`wahoo-${s.id}`}>Wahoo Route URL</Label>
                    <Input
                      id={`wahoo-${s.id}`}
                      name="route_wahoo_url"
                      defaultValue={s.route_wahoo_url ?? ""}
                      placeholder="https://elemnt.wahoo.com/routes/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor={`notes-${s.id}`}>Notes</Label>
                    <textarea
                      id={`notes-${s.id}`}
                      name="notes"
                      defaultValue={s.notes ?? ""}
                      placeholder="Any additional info for this ride..."
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
