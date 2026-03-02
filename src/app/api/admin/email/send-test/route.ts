import { NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";

export async function POST() {
  const adminEmail = process.env.MMM_ADMIN_EMAIL;
  if (!adminEmail) {
    return NextResponse.json(
      { error: "MMM_ADMIN_EMAIL not configured" },
      { status: 500 }
    );
  }

  const envSummary = [
    `RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "set" : "MISSING"}`,
    `RESEND_FROM: ${process.env.RESEND_FROM ?? "(default)"}`,
    `MMM_ADMIN_EMAIL: ${adminEmail}`,
    `WELCOME_EMAIL_ENABLED: ${process.env.WELCOME_EMAIL_ENABLED ?? "(not set)"}`,
    `CRON_SECRET: ${process.env.CRON_SECRET ? "set" : "MISSING"}`,
    `NODE_ENV: ${process.env.NODE_ENV}`,
  ].join("\n");

  const timestamp = new Date().toISOString();

  const result = await sendEmail(
    {
      from: getFromAddress(),
      to: adminEmail,
      subject: `[MMM] Email Test — ${timestamp}`,
      html: `
        <h2>Email Delivery Test</h2>
        <p>This is a test email sent from the MMM admin panel.</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <h3>Environment Summary</h3>
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 13px;">${envSummary}</pre>
        <p>If you received this, email delivery is working correctly.</p>
      `,
    },
    "admin-test"
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Send failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sentTo: adminEmail, timestamp });
}
