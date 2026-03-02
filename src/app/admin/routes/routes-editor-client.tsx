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

export interface OccurrenceRouteItem {
  id: string;
  date: string;
  displayDate: string;
  seriesTitle: string;
  route_ridewithgps_url: string | null;
  route_strava_url: string | null;
  route_embed_html: string | null;
}

export function RoutesEditorClient({
  occurrences,
  updateAction,
}: {
  occurrences: OccurrenceRouteItem[];
  updateAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<Record<string, string>>({});

  function handleSave(id: string, form: HTMLFormElement) {
    setSavingId(id);
    setErrorMsg((prev) => ({ ...prev, [id]: "" }));
    startTransition(async () => {
      try {
        const fd = new FormData(form);
        fd.set("id", id);
        await updateAction(fd);
        router.refresh();
      } catch (e) {
        setErrorMsg((prev) => ({ ...prev, [id]: (e as Error).message }));
      } finally {
        setSavingId(null);
      }
    });
  }

  if (occurrences.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-lg font-medium text-muted-foreground">
          No upcoming occurrences
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the Rides editor to generate occurrences.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {occurrences.map((occ) => {
        const isExpanded = expandedId === occ.id;
        const isSaving = isPending && savingId === occ.id;
        const hasRouteData =
          occ.route_ridewithgps_url || occ.route_strava_url || occ.route_embed_html;

        return (
          <Card key={occ.id}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : occ.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CardTitle className="text-base truncate">
                    {occ.seriesTitle}
                  </CardTitle>
                  {hasRouteData && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      Route set
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
                  <span>{occ.displayDate}</span>
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave(occ.id, e.currentTarget);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor={`rwgps-${occ.id}`}>RideWithGPS URL</Label>
                    <Input
                      id={`rwgps-${occ.id}`}
                      name="route_ridewithgps_url"
                      defaultValue={occ.route_ridewithgps_url ?? ""}
                      placeholder="https://ridewithgps.com/routes/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor={`strava-${occ.id}`}>Strava Route URL</Label>
                    <Input
                      id={`strava-${occ.id}`}
                      name="route_strava_url"
                      defaultValue={occ.route_strava_url ?? ""}
                      placeholder="https://www.strava.com/routes/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor={`embed-${occ.id}`}>Route Embed HTML</Label>
                    <textarea
                      id={`embed-${occ.id}`}
                      name="route_embed_html"
                      defaultValue={occ.route_embed_html ?? ""}
                      placeholder='Paste <iframe> from RideWithGPS or Strava (other hosts will be rejected)'
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Allowed hosts: ridewithgps.com, strava.com — script tags rejected.
                      Leave blank to inherit from the series default.
                    </p>
                  </div>

                  {errorMsg[occ.id] && (
                    <p className="text-xs text-destructive">{errorMsg[occ.id]}</p>
                  )}

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
