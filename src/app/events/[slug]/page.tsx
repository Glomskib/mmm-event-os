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
import { getEventMedia } from "@/lib/media";
import { HeroMedia } from "@/components/media/hero-media";
import { MediaGallery } from "@/components/media/media-gallery";
import { VideoEmbed } from "@/components/media/video-embed";

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

  const incentive = getMarketingIncentive(event.title);
  const media = await getEventMedia(event.id);

  const heroAsset = media.hero[0] ?? null;
  const galleryAssets = media.gallery;
  const highlightAssets = media.section;

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

        {incentive && (
          <MarketingIncentiveBanner
            title={incentive.title}
            perks={incentive.perks}
            deadlineIso={incentive.deadlineIso}
            eventSlug={incentive.eventSlug}
          />
        )}

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

            <Link href={`/register?event_id=${event.id}`}>
              <Button className="mt-4 w-full">Register Now</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Photo gallery */}
        {galleryAssets.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Photos</h2>
            <MediaGallery assets={galleryAssets} />
          </div>
        )}

        {/* Video highlights */}
        {highlightAssets.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Highlights</h2>
            <div className="space-y-4">
              {highlightAssets.map((asset) => (
                <VideoEmbed key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
