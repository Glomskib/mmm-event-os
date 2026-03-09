import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";

type SubscriberInput = {
  email: string;
  name?: string;
  tags?: string[];
};

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const org = await getCurrentOrg();
  if (!org) {
    return NextResponse.json({ error: "Org not found." }, { status: 500 });
  }

  let body: { subscribers: SubscriberInput[]; source: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { subscribers, source } = body;

  if (!Array.isArray(subscribers) || subscribers.length === 0) {
    return NextResponse.json(
      { error: "subscribers array is required." },
      { status: 400 }
    );
  }

  if (!source?.trim()) {
    return NextResponse.json(
      { error: "source is required." },
      { status: 400 }
    );
  }

  const db = createUntypedAdminClient();
  let imported = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const sub of subscribers) {
    const email = sub.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      errors.push(`Invalid email: ${sub.email}`);
      continue;
    }

    try {
      // Check if subscriber already exists for this org
      const { data: existing } = await db
        .from("email_subscribers")
        .select("id, tags")
        .eq("org_id", org.id)
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        // Update existing: merge tags, update name if provided
        const existingTags: string[] = existing.tags ?? [];
        const newTags = sub.tags ?? [];
        const mergedTags = Array.from(new Set([...existingTags, ...newTags]));

        const updateData: Record<string, unknown> = {
          tags: mergedTags,
        };
        if (sub.name?.trim()) {
          updateData.name = sub.name.trim();
        }

        const { error } = await db
          .from("email_subscribers")
          .update(updateData)
          .eq("id", existing.id);

        if (error) {
          errors.push(`Failed to update ${email}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        // Insert new subscriber
        const { error } = await db.from("email_subscribers").insert({
          org_id: org.id,
          email,
          name: sub.name?.trim() || null,
          source: source.trim(),
          tags: sub.tags ?? [],
          created_at: new Date().toISOString(),
        });

        if (error) {
          errors.push(`Failed to import ${email}: ${error.message}`);
        } else {
          imported++;
        }
      }
    } catch (err) {
      errors.push(`Error processing ${email}: ${String(err)}`);
    }
  }

  return NextResponse.json({ imported, updated, errors });
}
