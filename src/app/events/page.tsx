import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EarlyBirdCountdown } from "@/components/early-bird-countdown";
import { RegistrationUrgencyBanner } from "@/components/registration-urgency-banner";
import { MarketingIncentiveSnippet } from "@/components/marketing/event-incentive-banner";
import { EventSocialProof } from "@/components/marketing/event-social-proof";
import { getMarketingIncentive } from "@/lib/marketing-incentives";
import { slugify } from "@/lib/event-slug";

export const metadata = { title: "Events | MMM Event OS" };

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true });

  return (
    <>
      <Hero
        title="Events"
        subtitle="Upcoming community events — rides, meetups, and more."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Suspense>
            <RegistrationUrgencyBanner />
          </Suspense>
        </div>

        {events && events.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const incentive = getMarketingIncentive(event.title);
              const eventSlug = event.slug ?? slugify(event.title);

              return (
                <Card key={event.id} className="overflow-hidden">
                  {event.image_url && (
                    <Link href={`/events/${eventSlug}`}>
                      <div className="aspect-video bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </Link>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Link href={`/events/${eventSlug}`}>
                        <CardTitle className="text-lg hover:underline">
                          {event.title}
                        </CardTitle>
                      </Link>
                      <StatusBadge status={event.status} />
                    </div>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {incentive && (
                      <MarketingIncentiveSnippet
                        title={incentive.title}
                        deadlineIso={incentive.deadlineIso}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.early_bird_deadline && (
                      <EarlyBirdCountdown
                        deadline={event.early_bird_deadline}
                      />
                    )}
                    <Suspense>
                      <EventSocialProof eventId={event.id} />
                    </Suspense>
                    <Link href={`/waiver?event_id=${event.id}`}>
                      <Button className="mt-2 w-full" size="sm">
                        Register
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No upcoming events</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon for new events.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
