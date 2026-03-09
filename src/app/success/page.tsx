import { Hero } from "@/components/layout/hero";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { ReferralShareCard } from "./referral-share-card";

export const metadata = { title: "Registration Confirmed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string;
    free?: string;
    registration_id?: string;
  }>;
}) {
  const { session_id, free, registration_id } = await searchParams;
  const isFree = free === "true";

  let session = null;
  if (session_id && !isFree) {
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch {
      // Invalid session — show generic confirmation
    }
  }

  // Load registration details from DB for waiver info
  let registration: {
    distance: string | null;
    waiver_version: string | null;
    waiver_accepted_at: string | null;
    waiver_ip: string | null;
    referral_code: string | null;
    amount: number;
  } | null = null;

  const regId =
    registration_id || session?.metadata?.registration_id || null;

  if (regId) {
    const db = createAdminClient();
    const { data } = await db
      .from("registrations")
      .select(
        "distance, waiver_version, waiver_accepted_at, waiver_ip, referral_code, amount"
      )
      .eq("id", regId)
      .single();
    registration = data;
  }

  // Fetch logged-in user's own referral code for sharing
  let userReferralCode: string | null = null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: codeRow } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .single();
    userReferralCode = codeRow?.code ?? null;
  }

  const meta = session?.metadata;

  return (
    <>
      <Hero title="You're In!" subtitle="Registration confirmed." />

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <CardTitle className="text-2xl">Registration Confirmed</CardTitle>
            <CardDescription>
              {isFree
                ? "You're registered! No payment required for this distance."
                : session
                  ? `Thank you for registering! Your payment of $${((session.amount_total || 0) / 100).toFixed(2)} has been received.`
                  : "Your registration has been confirmed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 text-sm space-y-2">
              {(registration?.distance || meta?.distance) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">
                    {registration?.distance || meta?.distance}
                  </span>
                </div>
              )}
              {session_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmation</span>
                  <span className="font-mono text-xs">
                    {session_id.slice(-8).toUpperCase()}
                  </span>
                </div>
              )}
              {(registration?.referral_code || meta?.referral_code) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referral</span>
                  <span className="font-medium">
                    {registration?.referral_code || meta?.referral_code}
                  </span>
                </div>
              )}
              {registration?.waiver_version && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waiver version</span>
                  <span className="font-mono text-xs">
                    {registration.waiver_version}
                  </span>
                </div>
              )}
              {registration?.waiver_accepted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waiver signed</span>
                  <span className="font-mono text-xs">
                    {new Date(registration.waiver_accepted_at).toLocaleString()}
                    {registration.waiver_ip &&
                      ` from ${registration.waiver_ip}`}
                  </span>
                </div>
              )}
              {isFree && !registration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">Free registration</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center">
              <Link href="/events">
                <Button variant="outline">Browse More Events</Button>
              </Link>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Referral share section */}
        {userReferralCode && (
          <ReferralShareCard code={userReferralCode} />
        )}
      </section>
    </>
  );
}
