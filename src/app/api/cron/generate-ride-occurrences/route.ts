import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLogger, writeSystemLog } from "@/lib/logger";

export const maxDuration = 60;

const log = createLogger("cron:generate-ride-occurrences");

/**
 * Generates ride_occurrences for the next 14 days based on ride_series.
 * Idempotent — skips dates where an occurrence already exists.
 * Intended to run weekly via Vercel cron (Sunday 6 AM UTC).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timer = log.timed("execute");
  const admin = createAdminClient();

  // Get MMM org
  const { data: org, error: orgError } = await admin
    .from("orgs")
    .select("id")
    .eq("slug", "making-miles-matter")
    .single();

  if (!org || orgError) {
    return NextResponse.json(
      { error: "Org not found", detail: orgError?.message },
      { status: 500 }
    );
  }

  // Fetch all ride series for this org
  const { data: seriesList, error: seriesError } = await admin
    .from("ride_series")
    .select("id, day_of_week")
    .eq("org_id", org.id);

  if (seriesError) {
    return NextResponse.json(
      { error: "Failed to fetch ride_series", detail: seriesError.message },
      { status: 500 }
    );
  }

  if (!seriesList || seriesList.length === 0) {
    return NextResponse.json({ ok: true, created: 0, existing: 0, message: "No ride series found" });
  }

  // Build the set of dates for the next 14 days
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  // For each series, find matching dates by day_of_week
  const toInsert: { org_id: string; series_id: string; date: string }[] = [];
  const seriesDatePairs: { series_id: string; date: string }[] = [];

  for (const series of seriesList) {
    for (const d of dates) {
      if (d.getUTCDay() === series.day_of_week) {
        const dateStr = d.toISOString().split("T")[0];
        seriesDatePairs.push({ series_id: series.id, date: dateStr });
      }
    }
  }

  if (seriesDatePairs.length === 0) {
    return NextResponse.json({ ok: true, created: 0, existing: 0, message: "No matching dates" });
  }

  // Fetch existing occurrences to check for duplicates
  const dateStrings = [...new Set(seriesDatePairs.map((p) => p.date))];
  const seriesIds = [...new Set(seriesDatePairs.map((p) => p.series_id))];

  const { data: existingOccurrences, error: existingError } = await admin
    .from("ride_occurrences")
    .select("series_id, date")
    .in("series_id", seriesIds)
    .in("date", dateStrings);

  if (existingError) {
    return NextResponse.json(
      { error: "Failed to check existing occurrences", detail: existingError.message },
      { status: 500 }
    );
  }

  // Build a set of existing series_id+date combos for fast lookup
  const existingSet = new Set(
    (existingOccurrences ?? []).map((o) => `${o.series_id}|${o.date}`)
  );

  let existing = 0;

  for (const pair of seriesDatePairs) {
    const key = `${pair.series_id}|${pair.date}`;
    if (existingSet.has(key)) {
      existing++;
    } else {
      toInsert.push({
        org_id: org.id,
        series_id: pair.series_id,
        date: pair.date,
      });
    }
  }

  let created = 0;

  if (toInsert.length > 0) {
    const { error: insertError, count } = await admin
      .from("ride_occurrences")
      .insert(toInsert);

    if (insertError) {
      writeSystemLog("cron:generate-ride-occurrences", "Insert failed", {
        error: insertError.message,
        attempted: toInsert.length,
      });
      return NextResponse.json(
        { error: "Failed to insert occurrences", detail: insertError.message },
        { status: 500 }
      );
    }

    created = toInsert.length;
  }

  const durationMs = timer.end({ created, existing });

  writeSystemLog("cron:generate-ride-occurrences", "Execution complete", {
    created,
    existing,
    seriesCount: seriesList.length,
    durationMs,
  });

  return NextResponse.json({ ok: true, created, existing });
}
