import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, getFromAddress } from "@/lib/resend";
import { wrapInBrandLayout } from "@/lib/email-templates";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const db = createAdminClient();

    // Fetch campaign
    const { data: campaign, error: campErr } = await db
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    if (campaign.status !== "draft") {
      return NextResponse.json(
        { error: "Campaign is not in draft status." },
        { status: 400 }
      );
    }

    // Mark as sending
    await db
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", id);

    // Get subscribers
    let query = db
      .from("email_subscribers")
      .select("id, email, name")
      .is("unsubscribed_at", null);

    if (campaign.tags_filter && campaign.tags_filter.length > 0) {
      query = query.overlaps("tags", campaign.tags_filter);
    }

    const { data: subscribers } = await query;

    if (!subscribers || subscribers.length === 0) {
      await db
        .from("email_campaigns")
        .update({ status: "sent", sent_at: new Date().toISOString(), total_sent: 0 })
        .eq("id", id);
      return NextResponse.json({ sent: 0 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://makingmilesmatter.com";
    let sentCount = 0;

    for (const sub of subscribers) {
      const brandedHtml = wrapInBrandLayout(campaign.body_html, appUrl)
        .replace("{{email}}", encodeURIComponent(sub.email));

      const { data: sendRecord } = await db
        .from("email_sends")
        .insert({
          campaign_id: id,
          subscriber_id: sub.id,
          status: "pending",
        })
        .select("id")
        .single();

      const result = await sendEmail(
        {
          from: getFromAddress(),
          to: sub.email,
          subject: campaign.subject,
          html: brandedHtml,
        },
        `campaign:${id}`
      );

      if (result.success) {
        sentCount++;
        if (sendRecord) {
          await db
            .from("email_sends")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", sendRecord.id);
        }
      } else if (sendRecord) {
        await db
          .from("email_sends")
          .update({ status: "failed" })
          .eq("id", sendRecord.id);
      }
    }

    await db
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_sent: sentCount,
      })
      .eq("id", id);

    return NextResponse.json({ sent: sentCount });
  } catch (err) {
    console.error("[campaigns/send]", err);
    return NextResponse.json({ error: "Send failed." }, { status: 500 });
  }
}
