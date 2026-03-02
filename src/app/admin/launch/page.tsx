import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { CopyNotesButton } from "./copy-notes-button";

export const metadata = { title: "Launch Readiness | MMM Event OS" };

interface CheckItem {
  label: string;
  passed: boolean;
  detail?: string;
}

export default async function LaunchPage() {
  const admin = createAdminClient();
  const org = await getCurrentOrg();
  const checks: CheckItem[] = [];

  // 1. Supabase connected
  let supabaseOk = false;
  try {
    const { error } = await admin
      .from("orgs")
      .select("id")
      .limit(1)
      .single();
    supabaseOk = !error;
  } catch {
    supabaseOk = false;
  }
  checks.push({
    label: "Supabase connected",
    passed: supabaseOk,
    detail: supabaseOk ? "Query successful" : "Cannot reach database",
  });

  // 2. Stripe secret key
  const stripeKey = !!process.env.STRIPE_SECRET_KEY;
  checks.push({
    label: "Stripe secret key (STRIPE_SECRET_KEY)",
    passed: stripeKey,
    detail: stripeKey ? "Present" : "Missing",
  });

  // 3. Stripe webhook secret
  const stripeWebhook = !!process.env.STRIPE_WEBHOOK_SECRET;
  checks.push({
    label: "Stripe webhook secret (STRIPE_WEBHOOK_SECRET)",
    passed: stripeWebhook,
    detail: stripeWebhook ? "Present" : "Missing — webhooks will fail",
  });

  // 4. Resend API key
  const resendKey = !!process.env.RESEND_API_KEY;
  checks.push({
    label: "Resend API key (RESEND_API_KEY)",
    passed: resendKey,
    detail: resendKey ? "Present" : "Missing — emails will fail",
  });

  // 5. Cron secret
  const cronSecret = !!process.env.CRON_SECRET;
  checks.push({
    label: "Cron secret (CRON_SECRET)",
    passed: cronSecret,
    detail: cronSecret ? "Present" : "Missing — cron jobs unprotected",
  });

  // 6. Weekly ride email approval mode
  const approvalMode = !!process.env.WEEKLY_RIDE_EMAIL_APPROVAL_MODE;
  checks.push({
    label: "Weekly email approval mode (WEEKLY_RIDE_EMAIL_APPROVAL_MODE)",
    passed: approvalMode,
    detail: approvalMode
      ? `Set to "${process.env.WEEKLY_RIDE_EMAIL_APPROVAL_MODE}"`
      : "Not set — emails will send immediately",
  });

  // 7. Social drafts enabled
  const socialDrafts = !!process.env.SOCIAL_DRAFTS_ENABLED;
  checks.push({
    label: "Social drafts enabled (SOCIAL_DRAFTS_ENABLED)",
    passed: socialDrafts,
    detail: socialDrafts
      ? `Set to "${process.env.SOCIAL_DRAFTS_ENABLED}"`
      : "Not set — social draft cron disabled",
  });

  // 8. Late API key
  const lateKey = !!process.env.LATE_API_KEY;
  checks.push({
    label: "Late.dev API key (LATE_API_KEY)",
    passed: lateKey,
    detail: lateKey ? "Present" : "Missing — social publishing disabled",
  });

  // 9. At least 1 upcoming ride occurrence
  const today = new Date().toISOString().split("T")[0];
  const { count: rideCount } = await admin
    .from("ride_occurrences")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org?.id ?? "")
    .gte("date", today)
    .eq("cancelled", false);

  const hasRides = (rideCount ?? 0) > 0;
  checks.push({
    label: "Upcoming ride occurrences",
    passed: hasRides,
    detail: hasRides
      ? `${rideCount} upcoming ride${rideCount !== 1 ? "s" : ""}`
      : "No upcoming rides found",
  });

  // 10. Strava club join URL (optional — informational only)
  const stravaClubUrl = !!process.env.NEXT_PUBLIC_STRAVA_CLUB_JOIN_URL;
  checks.push({
    label: "Strava club join URL (NEXT_PUBLIC_STRAVA_CLUB_JOIN_URL)",
    passed: stravaClubUrl,
    detail: stravaClubUrl
      ? "Present — club CTA will show on /rides"
      : "Not set — Strava club section hidden on /rides (optional)",
  });

  // 11. At least 1 event exists (HHH / FFF)
  const { data: events } = await admin
    .from("events")
    .select("title")
    .eq("org_id", org?.id ?? "")
    .in("status", ["draft", "published"]);

  const eventTitles = (events ?? []).map((e) => e.title);
  const hasHHH = eventTitles.some((t) => /Hancock Horizontal Hundred 2026/i.test(t));
  const hasFFF = eventTitles.some((t) => /Findlay Further Fondo/i.test(t));
  const hasEvents = hasHHH || hasFFF;
  checks.push({
    label: "Events exist (HHH / FFF)",
    passed: hasEvents,
    detail: [hasHHH && "Hancock Horizontal Hundred 2026", hasFFF && "Findlay Further Fondo"]
      .filter(Boolean)
      .join(", ") || "No HHH or FFF events found",
  });

  const allPassed = checks.every((c) => c.passed);
  const passedCount = checks.filter((c) => c.passed).length;

  // Build deployment notes text
  const notes = [
    "=== MMM Event OS — Launch Readiness ===",
    `Date: ${new Date().toISOString().split("T")[0]}`,
    `Status: ${passedCount}/${checks.length} checks passing`,
    "",
    ...checks.map(
      (c) =>
        `${c.passed ? "[PASS]" : "[FAIL]"} ${c.label}${c.detail ? ` — ${c.detail}` : ""}`
    ),
    "",
    allPassed
      ? "All checks passing. Ready for launch."
      : "Some checks are failing. Review before deploying.",
  ].join("\n");

  return (
    <>
      <Hero
        title="Launch Readiness"
        subtitle={`${passedCount} of ${checks.length} checks passing`}
      />

      <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Badge variant={allPassed ? "default" : "destructive"}>
            {allPassed ? "Ready to Launch" : "Not Ready"}
          </Badge>
          <CopyNotesButton notes={notes} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.label}
                className="flex items-start gap-3 rounded-lg border px-4 py-3"
              >
                {check.passed ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{check.label}</p>
                  {check.detail && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {check.detail}
                    </p>
                  )}
                </div>
                <Badge
                  variant={check.passed ? "secondary" : "destructive"}
                  className="shrink-0 text-xs"
                >
                  {check.passed ? "Pass" : "Fail"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
