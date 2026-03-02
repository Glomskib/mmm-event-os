import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface EntryInput {
  year: number;
  miles: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { entries?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const entries = body.entries;
  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: "entries must be an array" }, { status: 400 });
  }

  // Validate each entry
  const validated: EntryInput[] = [];
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const year = Number(e.year);
    const miles = Number(e.miles);
    if (!Number.isInteger(year) || year < 1974 || year > 2024) {
      return NextResponse.json(
        { error: `Invalid year ${year}. Must be 1974–2024.` },
        { status: 400 }
      );
    }
    if (!Number.isInteger(miles) || miles < 0 || miles > 300) {
      return NextResponse.json(
        { error: `Invalid miles ${miles} for year ${year}. Must be 0–300.` },
        { status: 400 }
      );
    }
    validated.push({ year, miles });
  }

  if (validated.length === 0) {
    return NextResponse.json({ saved: 0 });
  }

  // Only upsert non-zero entries; delete zeros (or skip)
  const toUpsert = validated.map((e) => ({
    user_id: user.id,
    year: e.year,
    miles: e.miles,
  }));

  const admin = createAdminClient();
  const { error } = await admin
    .from("hhh_legacy_entries")
    .upsert(toUpsert, { onConflict: "user_id,year" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: toUpsert.length });
}
