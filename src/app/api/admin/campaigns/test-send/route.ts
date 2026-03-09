import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, getFromAddress } from "@/lib/resend";
import { wrapInBrandLayout } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { campaignId, testEmail } = await req.json();

    if (!campaignId || !testEmail) {
      return NextResponse.json(
        { error: "campaignId and testEmail are required." },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data: campaign, error: campErr } = await db
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campErr || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found." },
        { status: 404 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://makingmilesmatter.com";

    const brandedHtml = wrapInBrandLayout(campaign.body_html, appUrl).replace(
      "{{email}}",
      encodeURIComponent(testEmail)
    );

    const result = await sendEmail(
      {
        from: getFromAddress(),
        to: testEmail,
        subject: `[TEST] ${campaign.subject}`,
        html: brandedHtml,
      },
      `campaign-test:${campaignId}`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Send failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[campaigns/test-send]", err);
    return NextResponse.json({ error: "Test send failed." }, { status: 500 });
  }
}
