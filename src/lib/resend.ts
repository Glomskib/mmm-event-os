import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeSystemLog } from "@/lib/logger";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export function getFromAddress() {
  return process.env.RESEND_FROM ?? "Miles <miles@makingmilesmatter.com>";
}

/**
 * Send email via Resend with retry logic.
 * Retries up to 2 times with exponential backoff for non-4xx errors.
 * Logs results to system_logs.
 */
async function sendWithRetry(
  params: Parameters<Resend["emails"]["send"]>[0],
  label: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  const maxRetries = 2;
  const logMeta = { to: String(params.to), subject: params.subject, label };

  writeSystemLog("email:send_attempt", `Attempting (${label})`, logMeta);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await resend.emails.send(params);
      if (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        // Don't retry 4xx errors (bad request, auth, etc.)
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          writeSystemLog("email:failed", `Failed (${label}): ${error.message}`, {
            ...logMeta,
            attempt,
            statusCode,
          });
          return { success: false, error: error.message };
        }
        // Retryable error
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
          continue;
        }
        writeSystemLog("email:failed", `Failed after retries (${label}): ${error.message}`, {
          ...logMeta,
          attempts: attempt + 1,
        });
        return { success: false, error: error.message };
      }

      writeSystemLog("email:sent", `Sent (${label})`, { ...logMeta, attempt });
      return { success: true };
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
      const msg = err instanceof Error ? err.message : "Unknown error";
      writeSystemLog("email:failed", `Exception after retries (${label}): ${msg}`, {
        ...logMeta,
        attempts: attempt + 1,
      });
      return { success: false, error: msg };
    }
  }

  return { success: false, error: "Exhausted retries" };
}

/**
 * Public wrapper for sending emails with retry + logging.
 * Use this from cron routes instead of raw resend.emails.send().
 */
export async function sendEmail(
  params: Parameters<Resend["emails"]["send"]>[0],
  label: string
): Promise<{ success: boolean; error?: string }> {
  return sendWithRetry(params, label);
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://makingmilesmatter.com";
  const firstName = profile.full_name?.split(" ")[0] || "there";

  const result = await sendWithRetry(
    {
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
    },
    "welcome"
  );

  if (!result.success) {
    console.error("Welcome email send failed:", result.error);
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
  registrationId?: string;
}

export async function sendWaiverEmail(to: string, data: WaiverEmailData) {
  const { participantName, eventTitle, distance, signedAt, pdfUrl, registrationId } = data;

  // Idempotency: skip if waiver email was already sent for this registration
  if (registrationId) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("system_logs")
      .select("id")
      .eq("type", "email:waiver_sent")
      .eq("message", registrationId)
      .limit(1);

    if (existing && existing.length > 0) return;
  }

  const result = await sendWithRetry(
    {
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
    },
    "waiver"
  );

  // Mark as sent for idempotency
  if (result.success && registrationId) {
    writeSystemLog("email:waiver_sent", registrationId, { to });
  }

  // Internal copy
  if (process.env.MMM_ADMIN_EMAIL) {
    await sendWithRetry(
      {
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
      },
      "waiver-admin-copy"
    );
  }
}
