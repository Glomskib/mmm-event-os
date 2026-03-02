import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function GET(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? "2026", 10);

  const db = createAdminClient();

  const { data: votes, error } = await db
    .from("jersey_votes")
    .select(
      "created_at, year, design_id, jersey_designs(title), profiles(email, full_name)"
    )
    .eq("year", year)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (votes ?? []).map((v) => {
    const design = v.jersey_designs as { title?: string } | null;
    const profile = v.profiles as { email?: string; full_name?: string } | null;
    return [
      profile?.email ?? "",
      profile?.full_name ?? "",
      design?.title ?? "",
      v.created_at,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [
    '"Voter Email","Voter Name","Design","Voted At"',
    ...rows,
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jersey-votes-${year}.csv"`,
    },
  });
}
