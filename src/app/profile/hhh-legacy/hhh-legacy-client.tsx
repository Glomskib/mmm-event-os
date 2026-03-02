"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckCircle, ChevronDown, ChevronRight } from "lucide-react";

interface AutoReg {
  title: string;
  year: number;
  distance: string;
  status: string;
  miles: number;
}

interface Props {
  legacyEntries: Record<number, number>;
  autoRegistrations: AutoReg[];
  legacyMilesTotal: number;
  autoMilesTotal: number;
  totalMiles: number;
}

const DECADES: Array<{ label: string; years: number[] }> = [
  { label: "1970s", years: Array.from({ length: 6 }, (_, i) => 1974 + i) },
  { label: "1980s", years: Array.from({ length: 10 }, (_, i) => 1980 + i) },
  { label: "1990s", years: Array.from({ length: 10 }, (_, i) => 1990 + i) },
  { label: "2000s", years: Array.from({ length: 10 }, (_, i) => 2000 + i) },
  { label: "2010s", years: Array.from({ length: 10 }, (_, i) => 2010 + i) },
  { label: "2020s", years: Array.from({ length: 5 }, (_, i) => 2020 + i) },
];

function initMiles(legacyEntries: Record<number, number>): Record<number, number> {
  const all: Record<number, number> = {};
  for (let y = 1974; y <= 2024; y++) {
    all[y] = legacyEntries[y] ?? 0;
  }
  return all;
}

export function HhhLegacyClient({
  legacyEntries,
  autoRegistrations,
  legacyMilesTotal: initialLegacy,
  autoMilesTotal,
  totalMiles: initialTotal,
}: Props) {
  const [miles, setMiles] = useState<Record<number, number>>(() =>
    initMiles(legacyEntries)
  );
  const [openDecades, setOpenDecades] = useState<Set<string>>(
    new Set(["2020s"]) // newest open by default
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const legacyTotal = Object.values(miles).reduce((s, m) => s + m, 0);
  const grandTotal = legacyTotal + autoMilesTotal;

  function toggleDecade(label: string) {
    setOpenDecades((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function setYear(year: number, val: string) {
    const n = parseInt(val, 10);
    setMiles((prev) => ({ ...prev, [year]: isNaN(n) ? 0 : Math.min(300, Math.max(0, n)) }));
    setSaveStatus("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);

    const entries = Object.entries(miles)
      .map(([year, mi]) => ({ year: parseInt(year, 10), miles: mi }))
      .filter((e) => e.miles > 0 || legacyEntries[e.year] !== undefined);

    try {
      const res = await fetch("/api/hhh-legacy/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* empty */ }

      if (!res.ok) {
        setSaveError((data.error as string) ?? "Save failed");
        setSaveStatus("error");
      } else {
        setSaveStatus("success");
      }
    } catch {
      setSaveError("Network error. Please try again.");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Totals summary */}
      <div className="grid grid-cols-3 gap-4">
        <TotalCard label="Legacy Miles" value={legacyTotal} subtitle="1974–2024 (editable)" />
        <TotalCard label="Auto Miles" value={autoMilesTotal} subtitle="2025+ (from registrations)" />
        <TotalCard label="Total Miles" value={grandTotal} highlight />
      </div>

      {/* Legacy entry editor */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy Miles (1974–2024)</CardTitle>
          <CardDescription>
            Enter miles ridden at HHH for each year. Values are saved to your
            profile and appear on the{" "}
            <a href="/hhh-legacy" className="text-primary underline">
              leaderboard
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DECADES.map((decade) => {
            const isOpen = openDecades.has(decade.label);
            const decadeTotal = decade.years.reduce((s, y) => s + (miles[y] ?? 0), 0);
            return (
              <div key={decade.label} className="rounded-lg border border-border">
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => toggleDecade(decade.label)}
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{decade.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {decadeTotal > 0 ? `${decadeTotal} mi` : "—"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4">
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                      {decade.years.map((year) => (
                        <div key={year} className="flex items-center gap-2">
                          <label
                            htmlFor={`year-${year}`}
                            className="w-10 shrink-0 text-sm text-muted-foreground"
                          >
                            {year}
                          </label>
                          <div className="flex flex-1 items-center gap-1">
                            <input
                              id={`year-${year}`}
                              type="number"
                              min={0}
                              max={300}
                              step={1}
                              value={miles[year] ?? 0}
                              onChange={(e) => setYear(year, e.target.value)}
                              className="w-20 rounded-md border border-border bg-card px-2 py-1 text-sm text-right text-foreground focus:outline-none focus:ring-[2px] focus:ring-ring/50"
                            />
                            <span className="text-xs text-muted-foreground">mi</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving…" : "Save Legacy Miles"}
            </Button>

            {saveStatus === "success" && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Saved!
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-red-600">{saveError}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-counted registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Counted Registrations (2025+)</CardTitle>
          <CardDescription>
            Miles from your HHH registrations are counted automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {autoRegistrations.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No HHH registrations found for 2025+.
            </p>
          ) : (
            <div className="space-y-2">
              {autoRegistrations.map((reg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{reg.year} HHH</p>
                    <p className="text-xs text-muted-foreground">{reg.distance}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={reg.status} />
                    <span className="font-semibold text-primary">
                      +{reg.miles} mi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TotalCard({
  label,
  value,
  subtitle,
  highlight,
}: {
  label: string;
  value: number;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        highlight
          ? "border-primary/40 bg-primary/8"
          : "border-border bg-card"
      }`}
      style={
        highlight
          ? { backgroundColor: "color-mix(in srgb, var(--brand-orange) 8%, white)" }
          : undefined
      }
    >
      <p
        className={`text-3xl font-bold ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-foreground">{label}</p>
      {subtitle && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
