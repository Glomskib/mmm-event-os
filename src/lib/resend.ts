import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export function getFromAddress() {
  return process.env.RESEND_FROM ?? "Miles <miles@makingmilesmatter.com>";
}

/**
 * Send welcome email to a newly confirmed user.
 * Idempotent: skips if already sent (checks welcome_email_sent_at).
 * Returns true if sent, false if skipped/disabled.
 */
export async function sendWelcomeEmail(userId: string): Promise<boolean> {
  if (process.env.WELCOME_EMAIL_ENABLED === "false") return false;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile || profile.welcome_email_sent_at) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://makingmilesmatter.org";
  const firstName = profile.full_name?.split(" ")[0] || "there";
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: profile.email,
    subject: "Welcome to Making Miles Matter!",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Welcome, ${firstName}!</h2>
        <p>You're officially part of the Making Miles Matter community. Here's how to get started:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
              <a href="${appUrl}/events" style="color: #2563eb; text-decoration: none; font-weight: 600;">
                Upcoming Events
              </a>
              <br/>
              <span style="color: #666; font-size: 14px;">Register for rides and fundraisers</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
              <a href="${appUrl}/rides" style="color: #2563eb; text-decoration: none; font-weight: 600;">
                Group Rides
              </a>
              <br/>
              <span style="color: #666; font-size: 14px;">Join our weekly shop rides</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <a href="${appUrl}/leaderboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">
                Referral Leaderboard
              </a>
              <br/>
              <span style="color: #666; font-size: 14px;">Refer friends, earn raffle tickets and rewards</span>
            </td>
          </tr>
        </table>

        <p>See you on the road!</p>
        <p>— The Making Miles Matter Team</p>
      </div>
    `,
  });

  if (error) {
    console.error("Welcome email send failed:", error);
    return false;
  }

  await admin
    .from("profiles")
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq("id", userId);

  return true;
}

interface WaiverEmailData {
  participantName: string;
  eventTitle: string;
  distance: string;
  signedAt: string;
  pdfUrl: string;
}

export async function sendWaiverEmail(to: string, data: WaiverEmailData) {
  const { participantName, eventTitle, distance, signedAt, pdfUrl } = data;
  const resend = getResend();

  await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: `Your Registration + Waiver Copy — ${eventTitle}`,
    html: `
      <h2>Registration Confirmed</h2>
      <p>Hi ${participantName},</p>
      <p>You're registered for <strong>${eventTitle}</strong> (${distance}).</p>
      <p>Your waiver was signed on ${new Date(signedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}.</p>
      <p><a href="${pdfUrl}">Download your signed waiver (PDF)</a></p>
      <p>This link expires in 7 days. If you need another copy, contact us.</p>
      <br/>
      <p>— Making Miles Matter</p>
    `,
  });

  // Internal copy
  if (process.env.MMM_ADMIN_EMAIL) {
    await resend.emails.send({
      from: getFromAddress(),
      to: process.env.MMM_ADMIN_EMAIL,
      subject: `[Admin] New Registration — ${participantName} — ${eventTitle}`,
      html: `
        <h3>New Registration</h3>
        <p><strong>Participant:</strong> ${participantName} (${to})</p>
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Distance:</strong> ${distance}</p>
        <p><strong>Waiver signed:</strong> ${signedAt}</p>
        <p><a href="${pdfUrl}">Waiver PDF</a></p>
      `,
    });
  }
}
