import { Hero } from "@/components/layout/hero";
import { EmailControlsClient } from "./email-controls-client";

export const metadata = { title: "Email | Admin | MMM Event OS" };

async function sendTestEmail() {
  "use server";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://makingmilesmatter.org";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) throw new Error("CRON_SECRET not configured");

  const res = await fetch(`${baseUrl}/api/cron/weekly-ride-email?test=true`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to send test email");

  return json as { ok: boolean; emailsSent?: number; emailErrors?: number; rideCount?: number; skipped?: string };
}

async function sendLiveEmail() {
  "use server";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://makingmilesmatter.org";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) throw new Error("CRON_SECRET not configured");

  const res = await fetch(`${baseUrl}/api/cron/weekly-ride-email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to send live email");

  return json as { ok: boolean; emailsSent?: number; emailErrors?: number; rideCount?: number; skipped?: string };
}

export default function AdminEmailPage() {
  return (
    <>
      <Hero
        title="Email Controls"
        subtitle="Send weekly ride schedule emails"
      />

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <EmailControlsClient
          sendTestAction={sendTestEmail}
          sendLiveAction={sendLiveEmail}
        />
      </section>
    </>
  );
}
