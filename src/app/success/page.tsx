import { Hero } from "@/components/layout/hero";
import { stripe } from "@/lib/stripe";
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

export const metadata = { title: "Registration Confirmed | MMM Event OS" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let session = null;
  if (session_id) {
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch {
      // Invalid session — show generic confirmation
    }
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
              {session
                ? `Thank you for registering! Your payment of $${((session.amount_total || 0) / 100).toFixed(2)} has been received.`
                : "Your registration has been confirmed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meta && (
              <div className="rounded-lg border p-4 text-sm space-y-2">
                {meta.distance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-medium">{meta.distance}</span>
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
                {meta.referral_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referral</span>
                    <span className="font-medium">{meta.referral_code}</span>
                  </div>
                )}
              </div>
            )}

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
      </section>
    </>
  );
}
