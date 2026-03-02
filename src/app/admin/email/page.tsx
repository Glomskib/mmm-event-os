import { Hero } from "@/components/layout/hero";
import { EmailControlsClient } from "./email-controls-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function sendDeliveryTest() {
  "use server";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://makingmilesmatter.org";
  const res = await fetch(`${baseUrl}/api/admin/email/send-test`, {
    method: "POST",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Send failed");
  return json as { ok: boolean; sentTo: string; timestamp: string };
}

function EnvCheck({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {present ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={present ? "text-foreground" : "text-red-600 font-medium"}>
        {label}
      </span>
    </div>
  );
}

export default async function AdminEmailPage() {
  // Delivery status checks
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasAdminEmail = !!process.env.MMM_ADMIN_EMAIL;
  const hasCronSecret = !!process.env.CRON_SECRET;
  const fromAddress = process.env.RESEND_FROM ?? "Miles <miles@makingmilesmatter.com>";

  // Recent email log counts
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [sentResult, failedResult] = await Promise.all([
    admin
      .from("system_logs")
      .select("id", { count: "exact", head: true })
      .eq("type", "email:sent")
      .gte("created_at", since),
    admin
      .from("system_logs")
      .select("id", { count: "exact", head: true })
      .eq("type", "email:failed")
      .gte("created_at", since),
  ]);

  const sentCount = sentResult.count ?? 0;
  const failedCount = failedResult.count ?? 0;

  return (
    <>
      <Hero
        title="Email Controls"
        subtitle="Delivery status, test sends, and weekly ride emails"
      />

      <section className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        {/* Delivery Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <EnvCheck label="RESEND_API_KEY" present={hasResendKey} />
            <EnvCheck label="MMM_ADMIN_EMAIL" present={hasAdminEmail} />
            <EnvCheck label="CRON_SECRET" present={hasCronSecret} />
            <div className="text-sm text-muted-foreground">
              From: <span className="font-mono text-xs">{fromAddress}</span>
            </div>
            <div className="mt-2 flex gap-4 border-t pt-3 text-sm">
              <span>
                Last 24h: <strong className="text-green-700">{sentCount}</strong> sent
              </span>
              <span>
                <strong className={failedCount > 0 ? "text-red-600" : "text-muted-foreground"}>
                  {failedCount}
                </strong>{" "}
                failed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <EmailControlsClient
          sendTestAction={sendTestEmail}
          sendLiveAction={sendLiveEmail}
          sendDeliveryTestAction={sendDeliveryTest}
        />
      </section>
    </>
  );
}
