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
import { HeroMedia } from "@/components/media/hero-media";
import { MediaGallery } from "@/components/media/media-gallery";
import { VideoEmbed } from "@/components/media/video-embed";
import { LegacyStrip } from "@/components/event/legacy-strip";
import { CTABand } from "@/components/event/cta-band";
import { SponsorsSection } from "@/components/event/sponsors-section";
import { RouteSection } from "@/components/event/route-section";
import { TestimonialsSection } from "@/components/event/testimonials-section";
import { getCurrentOrg } from "@/lib/org";

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

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true });

  const event = events?.find((e) => (e.slug ?? slugify(e.title)) === slug);
  if (!event) notFound();

  const isHHH = event.series_key === "hhh";
  const incentive = getMarketingIncentive(event.title);
  const eventSlug = event.slug ?? slugify(event.title);

  // Media, sponsors, and HHH-specific data fetched in parallel
  const [media, org] = await Promise.all([
    getEventMedia(event.id),
    getCurrentOrg(),
  ]);

  const [sponsors, legacyStats, userMiles] = await Promise.all([
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
            <CardTitle>{event.title}</CardTitle>
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

        {/* Route preview */}
        <RouteSection assets={media.route_preview} />

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

        {/* HHH CTA band */}
        {isHHH && (
          <CTABand eventSlug={eventSlug} userMiles={userMiles} />
        )}

        {/* Sponsors */}
        <SponsorsSection sponsors={sponsors} />
      </section>
    </>
  );
}
