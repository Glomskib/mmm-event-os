import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EarlyBirdCountdown } from "@/components/early-bird-countdown";
import { RegistrationUrgencyBanner } from "@/components/registration-urgency-banner";
import { EventIncentiveBanner } from "@/components/event-incentive-banner";
import { getIncentiveForEvent } from "@/lib/incentive-config";

export const metadata = { title: "Events | MMM Event OS" };

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true });

  // Fetch paid+free registration counts per event for incentive banners
  const regCounts = new Map<string, number>();
  if (events && events.length > 0) {
    const admin = createAdminClient();
    const { data: regs } = await admin
      .from("registrations")
      .select("event_id")
      .in("event_id", events.map((e) => e.id))
      .in("status", ["paid", "free"]);

    if (regs) {
      for (const r of regs) {
        regCounts.set(r.event_id, (regCounts.get(r.event_id) ?? 0) + 1);
      }
    }
  }

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
              const incentive = getIncentiveForEvent(event.title);
              const count = regCounts.get(event.id) ?? 0;

              return (
                <Card key={event.id} className="overflow-hidden">
                  {event.image_url && (
                    <div className="aspect-video bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge variant="secondary">{event.status}</Badge>
                    </div>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {incentive && (
                      <EventIncentiveBanner
                        title={incentive.title}
                        deadline={new Date(incentive.deadline)}
                        perks={incentive.perks}
                        eventSlug={incentive.eventSlug}
                        registeredCount={count}
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
                      <EarlyBirdCountdown deadline={event.early_bird_deadline} />
                    )}
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
