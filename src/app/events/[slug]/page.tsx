import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { slugify } from "@/lib/event-slug";
import { getMarketingIncentive } from "@/lib/marketing-incentives";
import { MarketingIncentiveBanner } from "@/components/marketing/event-incentive-banner";
import { EventSocialProof } from "@/components/marketing/event-social-proof";
import { Suspense } from "react";
import { getEventMedia, getActiveSponsors } from "@/lib/media";
import { getEventRegistrationStats } from "@/lib/registration-stats";
import { HeroMedia } from "@/components/media/hero-media";
import { MediaGallery } from "@/components/media/media-gallery";
import { VideoEmbed } from "@/components/media/video-embed";
import { LegacyStrip } from "@/components/event/legacy-strip";
import { CTABand } from "@/components/event/cta-band";
import { SponsorsSection } from "@/components/event/sponsors-section";
import { RouteSection } from "@/components/event/route-section";
import { getDistances } from "@/lib/pricing";
import { TestimonialsSection } from "@/components/event/testimonials-section";
import { RiderStats } from "@/components/event/rider-stats";
import { EventCountdown } from "@/components/event/event-countdown";
import { AnnualBadge } from "@/components/event/annual-badge";
import { getCurrentOrg } from "@/lib/org";
import { isVotingOpen } from "@/lib/jersey-voting";
import { Trophy } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("title, slug")
    .eq("status", "published");

  const event = events?.find((e) => (e.slug ?? slugify(e.title)) === slug);
  return { title: event ? `${event.title} | Making Miles Matter` : "Event Not Found" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true });

  if (eventsError) {
    console.error("[events/slug] events query failed:", eventsError.message);
    throw new Error(`Database error: ${eventsError.message}`);
  }

  const event = events?.find((e) => (e.slug ?? slugify(e.title)) === slug);
  if (!event) notFound();

  const isHHH = event.series_key === "hhh";
  const registrationOpen = event.registration_open ?? true;
  const incentive = getMarketingIncentive(event.title);
  const eventSlug = event.slug ?? slugify(event.title);
  const eventYear = new Date(event.date).getFullYear();
  const distances = getDistances(event.title).map((d) => d.distance);

  // All data fetched in parallel
  const [media, org, regStats] = await Promise.all([
    getEventMedia(event.id),
    getCurrentOrg(),
    getEventRegistrationStats(event.id, event.capacity ?? null),
  ]);

  const [sponsors, legacyStats, userMiles, userRegistration] = await Promise.all([
    org ? getActiveSponsors(org.id) : Promise.resolve([]),
    isHHH
      ? supabase
          .from("hhh_legacy_leaderboard_v")
          .select("total_hhh_miles")
          .then(({ data }) => {
            const rows = data ?? [];
            return {
              riderCount: rows.length,
              totalMiles: rows.reduce(
                (sum, r) => sum + (r.total_hhh_miles ?? 0),
                0
              ),
            };
          })
      : Promise.resolve(null),
    isHHH
      ? supabase.auth
          .getUser()
          .then(async ({ data: { user } }) => {
            if (!user) return null;
            const { data } = await supabase
              .from("hhh_legacy_leaderboard_v")
              .select("total_hhh_miles")
              .eq("user_id", user.id)
              .maybeSingle();
            return data?.total_hhh_miles ?? null;
          })
      : Promise.resolve(null),
    // Check if current user has a registration for this event
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) return null;
        const { data } = await supabase
          .from("registrations")
          .select("id, status, distance")
          .eq("user_id", user.id)
          .eq("event_id", event.id)
          .in("status", ["paid", "free", "pending"])
          .maybeSingle();
        return data as { id: string; status: string; distance: string } | null;
      }),
  ]);

  const heroAsset = media.hero[0] ?? null;

  return (
    <>
      {/* Use hero media if available, otherwise fall back to brand hero */}
      {heroAsset ? null : (
        <Hero title={event.title} subtitle={event.description ?? ""} />
      )}

      <section className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero media (replaces brand Hero when present) */}
        {heroAsset && (
          <HeroMedia asset={heroAsset} eventTitle={event.title} />
        )}

        {/* "You're registered" banner */}
        {userRegistration && (
          <div
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: "var(--brand-navy)" }}
          >
            <div className="flex items-center gap-2 text-sm text-white">
              <span className="text-green-400">✓</span>
              <span>
                You&apos;re registered{userRegistration.distance ? ` · ${userRegistration.distance}` : ""}
              </span>
            </div>
            {userRegistration.status === "pending" ? (
              <Link
                href={`/waiver?event_id=${event.id}&distance=${encodeURIComponent(userRegistration.distance)}`}
                className="shrink-0"
              >
                <Button
                  size="sm"
                  style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
                >
                  Finish Registration
                </Button>
              </Link>
            ) : (
              <Link href="/my-events" className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  My Events
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Countdown — below hero, urgency only when registration is open */}
        {registrationOpen && (
          <EventCountdown eventDate={event.date} />
        )}

        {/* Inline rider stats */}
        <RiderStats
          stats={regStats}
          registrationOpen={registrationOpen}
          variant="inline"
        />

        {/* Secondary hero images */}
        {media.hero_secondary.length > 0 && (
          <MediaGallery assets={media.hero_secondary} />
        )}

        {incentive && (
          <MarketingIncentiveBanner
            title={incentive.title}
            perks={incentive.perks}
            deadlineIso={incentive.deadlineIso}
            eventSlug={incentive.eventSlug}
          />
        )}

        {/* Event info card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{event.title}</CardTitle>
              {isHHH && <AnnualBadge eventYear={eventYear} />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
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

            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}

            <Suspense>
              <EventSocialProof eventId={event.id} />
            </Suspense>

            <Link href={`/register/${eventSlug}`}>
              <Button className="mt-4 w-full">Register Now</Button>
            </Link>
          </CardContent>
        </Card>

        {/* HHH Legacy Strip */}
        {isHHH && legacyStats && (
          <LegacyStrip
            riderCount={legacyStats.riderCount}
            totalMiles={legacyStats.totalMiles}
          />
        )}

        {/* Route experience */}
        <RouteSection
          distances={distances}
          elevationGain={event.elevation_gain ?? null}
          aidStations={event.aid_stations ?? null}
          terrainType={event.terrain_type ?? null}
          elevationChartAssets={media.elevation_chart}
          routeEmbedAssets={media.route_embed}
          gpxAssets={media.route_gpx}
          legacyPreviewAssets={media.route_preview}
        />

        {/* Photo gallery */}
        {media.gallery.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Photos</h2>
            <MediaGallery assets={media.gallery} />
          </div>
        )}

        {/* Inline section media */}
        {media.inline_section.length > 0 && (
          <MediaGallery assets={media.inline_section} />
        )}

        {/* Video highlights */}
        {media.section.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Highlights</h2>
            <div className="space-y-4">
              {media.section.map((asset) => (
                <VideoEmbed key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        <TestimonialsSection assets={media.testimonial} />

        {/* HHH CTA band with rider stats above button */}
        {isHHH && (
          <CTABand
            eventSlug={eventSlug}
            userMiles={userMiles}
            stats={regStats}
            registrationOpen={registrationOpen}
          />
        )}

        {/* Jersey voting CTA — HHH only, only while voting is open */}
        {isHHH && isVotingOpen() && (
          <div
            className="rounded-xl px-6 py-5 text-center"
            style={{ backgroundColor: "var(--brand-navy)" }}
          >
            <Trophy
              className="mx-auto mb-2 h-6 w-6"
              style={{ color: "var(--brand-orange)" }}
            />
            <h2 className="text-base font-bold text-white">
              Vote for the 2026 HHH Jersey
            </h2>
            <p className="mt-1 text-xs text-white/70">
              Voting closes May 1 — make your voice heard.
            </p>
            <Link href="/hhh-jersey-vote" className="mt-3 inline-block">
              <Button
                size="sm"
                style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
              >
                Vote Now
              </Button>
            </Link>
          </div>
        )}

        {/* Sponsors */}
        <SponsorsSection sponsors={sponsors} />
      </section>
    </>
  );
}
