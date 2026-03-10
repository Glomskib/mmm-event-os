import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getAdminOrNull } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createUntypedAdminClient();

  const { data, error } = await db
    .from("financial_summary")
    .insert({
      org_id: body.org_id,
      event_id: body.event_id,
      period: body.period,
      gross_registration_revenue: body.gross_registration_revenue,
      net_registration_revenue: body.net_registration_revenue,
      sponsor_revenue: body.sponsor_revenue,
      donation_revenue: body.donation_revenue,
      merch_revenue: body.merch_revenue,
      in_kind_value: body.in_kind_value,
      total_expenses: body.total_expenses,
      notes: body.notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
