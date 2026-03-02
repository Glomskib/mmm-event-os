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
import { Bike, Clock, MapPin, Users } from "lucide-react";
import { RouteButtons } from "@/components/rides/route-buttons";
import { RouteEmbed } from "@/components/rides/route-embed";
import { StravaClubCard } from "@/components/rides/strava-club-card";

export const metadata = { title: "Rides | MMM Event OS" };

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const difficultyColors: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  easy: "secondary",
  moderate: "default",
  hard: "destructive",
};

export default async function RidesPage() {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const thirtyDaysOut = new Date(today);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const thirtyDaysStr = thirtyDaysOut.toISOString().split("T")[0];

  // Two days ago for check-in window
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

  const [seriesRes, occurrencesRes] = await Promise.all([
    supabase.from("ride_series").select("*").order("day_of_week", { ascending: true }),
    supabase
      .from("ride_occurrences")
      .select("*, ride_series(*)")
      .gte("date", todayStr)
      .lte("date", thirtyDaysStr)
      .eq("cancelled", false)
      .order("date", { ascending: true }),
  ]);

  const series = seriesRes.data ?? [];
  const occurrences = occurrencesRes.data ?? [];

  // Fetch approved checkins for upcoming occurrences
  const admin = createAdminClient();
  const occIds = occurrences.map((o) => o.id);

  const { data: approvedCheckins } = occIds.length > 0
    ? await admin
        .from("checkins")
        .select("id, ride_occurrence_id, photo_path")
        .in("ride_occurrence_id", occIds)
        .eq("approved", true)
    : { data: [] };

  const riderCounts = new Map<string, number>();
  const ridePhotoPaths = new Map<string, string[]>();

  for (const c of approvedCheckins ?? []) {
    if (!c.ride_occurrence_id) continue;
    riderCounts.set(
      c.ride_occurrence_id,
      (riderCounts.get(c.ride_occurrence_id) ?? 0) + 1
    );
    const photos = ridePhotoPaths.get(c.ride_occurrence_id) ?? [];
    if (photos.length < 4 && c.photo_path) photos.push(c.photo_path);
    ridePhotoPaths.set(c.ride_occurrence_id, photos);
  }

  // Signed URLs for photo thumbnails
  const ridePhotoUrls = new Map<string, string[]>();
  for (const [occId, paths] of ridePhotoPaths) {
    const urls: string[] = [];
    for (const p of paths) {
      const { data } = await admin.storage.from("checkins").createSignedUrl(p, 3600);
      if (data?.signedUrl) urls.push(data.signedUrl);
    }
    ridePhotoUrls.set(occId, urls);
  }

  // Strava club config (NEXT_PUBLIC_ vars are inlined at build time)
  const stravaJoinUrl = process.env.NEXT_PUBLIC_STRAVA_CLUB_JOIN_URL ?? null;
  const stravaEmbedHtml = process.env.NEXT_PUBLIC_STRAVA_CLUB_EMBED_IFRAME ?? null;

  return (
    <>
      <Hero
        title="Group Rides"
        subtitle="Weekly ride series and upcoming scheduled rides."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">

        {/* ── Ride Series ─────────────────────────────── */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">Ride Series</h2>

          {series.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {series.map((ride) => (
                <Card key={ride.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ride.title}</CardTitle>
                      <Badge variant={difficultyColors[ride.difficulty]}>
                        {ride.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>{ride.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 shrink-0" />
                      <span>Every {dayNames[ride.day_of_week]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{ride.time}</span>
                    </div>
                    {(ride.meet_location ?? ride.location) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{ride.meet_location ?? ride.location}</span>
                      </div>
                    )}
                    <RouteButtons
                      ridewithgps={ride.route_ridewithgps_url}
                      strava={ride.route_strava_url}
                      wahoo={ride.route_wahoo_url}
                    />
                    {ride.route_embed_html && (
                      <RouteEmbed
                        routeEmbedHtml={ride.route_embed_html}
                        routeUrl={ride.route_ridewithgps_url}
                        title={`${ride.title} route`}
                      />
                    )}
                    {ride.notes && (
                      <p className="text-xs leading-relaxed">{ride.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bike className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No ride series yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon for scheduled rides.
              </p>
            </div>
          )}
        </div>

        {/* ── Upcoming Rides (next 30 days) ───────────── */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">Upcoming Rides</h2>

          {occurrences.length > 0 ? (
            <div className="space-y-4">
              {occurrences.map((occ) => {
                const sr = occ.ride_series as {
                  meet_location?: string | null;
                  route_ridewithgps_url?: string | null;
                  route_strava_url?: string | null;
                  route_wahoo_url?: string | null;
                  route_embed_html?: string | null;
                  notes?: string | null;
                } | null;

                // Occurrence overrides series
                const meetLoc = occ.meet_location ?? sr?.meet_location ?? null;
                const rwgps = occ.route_ridewithgps_url ?? sr?.route_ridewithgps_url ?? null;
                const strava = occ.route_strava_url ?? sr?.route_strava_url ?? null;
                const wahoo = occ.route_wahoo_url ?? sr?.route_wahoo_url ?? null;
                const embedHtml = occ.route_embed_html ?? sr?.route_embed_html ?? null;
                const notes = occ.notes ?? sr?.notes ?? null;

                const inCheckinWindow =
                  occ.date >= twoDaysAgoStr && occ.date <= todayStr;

                return (
                  <Card key={occ.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bike className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {occ.ride_series?.title ?? "Ride"}
                          </p>
                          {(riderCounts.get(occ.id) ?? 0) > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Users className="h-3 w-3" />
                              {riderCounts.get(occ.id)}{" "}
                              {riderCounts.get(occ.id) === 1 ? "rider" : "riders"}
                            </Badge>
                          )}
                          {inCheckinWindow && (
                            <Badge className="gap-1 bg-green-600 text-white hover:bg-green-700">
                              Check-in open
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {new Date(occ.date + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { weekday: "long", month: "long", day: "numeric" }
                          )}
                          {occ.note && ` — ${occ.note}`}
                        </p>

                        {meetLoc && (
                          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{meetLoc}</span>
                          </div>
                        )}

                        <RouteButtons
                          ridewithgps={rwgps}
                          strava={strava}
                          wahoo={wahoo}
                        />

                        {/* Route embed — shown inline if present */}
                        {embedHtml && (
                          <RouteEmbed
                            routeEmbedHtml={embedHtml}
                            routeUrl={rwgps}
                            title={`${occ.ride_series?.title ?? "Ride"} route`}
                          />
                        )}

                        {notes && (
                          <p className="text-xs text-muted-foreground">{notes}</p>
                        )}

                        {inCheckinWindow && (
                          <a
                            href="/checkin"
                            className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Bike className="h-3 w-3" />
                            Check in for raffle tickets
                          </a>
                        )}
                      </div>

                      {(ridePhotoUrls.get(occ.id)?.length ?? 0) > 0 && (
                        <div className="hidden shrink-0 sm:flex -space-x-2">
                          {ridePhotoUrls.get(occ.id)!.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={url}
                              alt="Ride photo"
                              className="h-10 w-10 rounded-full border-2 border-background object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No upcoming rides in the next 30 days.
            </p>
          )}
        </div>

        {/* ── Strava Club ─────────────────────────────── */}
        {stravaJoinUrl && (
          <div className="max-w-lg">
            <StravaClubCard joinUrl={stravaJoinUrl} embedHtml={stravaEmbedHtml} />
          </div>
        )}
      </section>
    </>
  );
}
