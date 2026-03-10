import { Hero } from "@/components/layout/hero";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bike, MapPin, Clock, Users, ArrowRight, Camera } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export const metadata = { title: "Weekly Rides" };

interface Ride {
  day: string;
  time: string;
  name: string;
  place: string;
  address: string;
  description: string;
  difficulty: "Easy" | "Moderate" | "Moderate-Hard" | "Hard";
}

const rides: Ride[] = [
  {
    day: "Monday",
    time: "6:30 PM",
    name: "No Drop Ride",
    place: "Further Bikes",
    address: "113 W Crawford St, Findlay, OH 45840",
    description:
      "All bikes and paces welcome. Routes vary each week.",
    difficulty: "Easy",
  },
  {
    day: "Tuesday",
    time: "6:30 PM",
    name: "Fitness Ride",
    place: "Findlay VFW",
    address: "315 Walnut St, Findlay, OH 45840",
    description:
      "Will break into groups based on speed. A Group 19-23 MPH, B Group 17-20 MPH, C Group 13-16 MPH. Total Distance 20-35 Miles. Routes vary each week.",
    difficulty: "Moderate-Hard",
  },
  {
    day: "Wednesday",
    time: "6:30 PM",
    name: "Party Pace Ride",
    place: "Further Bikes",
    address: "113 W Crawford St, Findlay, OH 45840",
    description:
      "All bikes and paces welcome. Short routes, vary each week. Feel free to hang at the bakeshop before the ride.",
    difficulty: "Easy",
  },
  {
    day: "Thursday",
    time: "6:30 PM",
    name: "Fast Paced Fitness Drop Ride",
    place: "Further Bikes",
    address: "113 W Crawford St, Findlay, OH 45840",
    description:
      '22+ MPH. Every man\u2026or woman\u2026for themselves.',
    difficulty: "Hard",
  },
  {
    day: "Friday",
    time: "6:30 PM",
    name: "MTB Skills Practice",
    place: "VB Mountain Bike Trail",
    address: "",
    description:
      "Fun skills practice laps. Bring mountain bike or gravel bike.",
    difficulty: "Moderate",
  },
  {
    day: "Saturday",
    time: "10:00 AM",
    name: "No Drop Ride",
    place: "Findlay Brewing",
    address: "",
    description:
      "All bikes and paces welcome. Routes vary each week.",
    difficulty: "Easy",
  },
  {
    day: "Sunday",
    time: "10:00 AM",
    name: "MTB Skills Practice",
    place: "Oak Openings Mountain Bike Trail",
    address: "3520 Waterville Swanton Rd, Swanton, OH 43558",
    description:
      'Fun skills practice laps. Bring mountain bike or gravel bike. Ride with "The Right Direction".',
    difficulty: "Moderate",
  },
];

function difficultyColor(difficulty: Ride["difficulty"]): string {
  switch (difficulty) {
    case "Easy":
      return "bg-green-600 text-white hover:bg-green-700";
    case "Moderate":
      return "bg-yellow-500 text-black hover:bg-yellow-600";
    case "Moderate-Hard":
      return "bg-orange-500 text-white hover:bg-orange-600";
    case "Hard":
      return "bg-red-600 text-white hover:bg-red-700";
  }
}

export default async function RidesPage() {
  const supabase = await createClient();
  const org = await getCurrentOrg();

  // Fetch recent check-in photos (last 60 days, up to 24)
  let checkinPhotos: { photo_path: string; created_at: string; ride_title: string; rider_name: string }[] = [];

  if (org) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: checkins } = await supabase
      .from("checkins")
      .select("photo_path, created_at, ride_occurrences(ride_series(title)), profiles(full_name)")
      .eq("org_id", org.id)
      .eq("approved", true)
      .not("photo_path", "is", null)
      .gte("created_at", sixtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(24);

    if (checkins) {
      for (const c of checkins) {
        if (!c.photo_path) continue;
        const occ = c.ride_occurrences as { ride_series?: { title?: string } | null } | null;
        const profile = c.profiles as { full_name?: string | null } | null;
        checkinPhotos.push({
          photo_path: c.photo_path,
          created_at: c.created_at,
          ride_title: occ?.ride_series?.title ?? "Community Ride",
          rider_name: profile?.full_name?.split(" ")[0] ?? "Rider",
        });
      }
    }
  }

  // Generate signed URLs for photos
  const photosWithUrls = await Promise.all(
    checkinPhotos.map(async (p) => {
      const { data } = await supabase.storage
        .from("checkins")
        .createSignedUrl(p.photo_path, 60 * 60); // 1 hour
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  const visiblePhotos = photosWithUrls.filter((p) => p.url);

  return (
    <>
      <Hero
        title="Weekly Rides"
        subtitle="Free community rides, 7 days a week. All levels welcome."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Ride Schedule Grid ─────────────────────── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rides.map((ride) => (
            <Card
              key={ride.day}
              className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg"
              style={{ borderColor: "var(--brand-navy)" }}
            >
              {/* FREE badge */}
              <div
                className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: "var(--brand-orange)" }}
              >
                FREE
              </div>

              <CardHeader className="pb-2">
                <p
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "var(--brand-orange)" }}
                >
                  {ride.day}
                </p>
                <CardTitle className="text-lg leading-tight">
                  {ride.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {/* Time */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" style={{ color: "var(--brand-navy)" }} />
                  <span className="font-medium">{ride.time}</span>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand-navy)" }} />
                  <span>
                    {ride.place}
                    {ride.address && (
                      <>
                        <br />
                        <span className="text-xs">{ride.address}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed">{ride.description}</p>

                {/* Difficulty */}
                <div className="flex items-center gap-2 pt-1">
                  <Bike className="h-4 w-4 shrink-0" style={{ color: "var(--brand-navy)" }} />
                  <Badge className={difficultyColor(ride.difficulty)}>
                    {ride.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Info section ────────────────────────────── */}
        <div
          className="mt-16 rounded-xl p-8 text-center"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand-navy) 8%, transparent)" }}
        >
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
            <Users className="h-10 w-10" style={{ color: "var(--brand-orange)" }} />
            <h2 className="text-2xl font-bold">Open to Everyone</h2>
            <p className="text-muted-foreground">
              All rides are free and open to the public. No registration
              required &mdash; just show up! Check in at each ride to earn
              raffle tickets for our events.
            </p>
          </div>
        </div>

        {/* ── Past Rides Collage ──────────────────────── */}
        {visiblePhotos.length > 0 && (
          <div className="mt-16">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2">
                <Camera className="h-6 w-6" style={{ color: "var(--brand-orange)" }} />
                <h2 className="text-2xl font-bold">Past Rides</h2>
              </div>
              <p className="mt-2 text-muted-foreground">
                Check-in photos from our community riders.
              </p>
            </div>

            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
              {visiblePhotos.map((photo, i) => (
                <div
                  key={i}
                  className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url!}
                    alt={`${photo.rider_name} at ${photo.ride_title}`}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-sm font-semibold text-white">
                      {photo.ride_title}
                    </p>
                    <p className="text-xs text-white/70">
                      {photo.rider_name} &middot;{" "}
                      {new Date(photo.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link href="/checkin">
                <Button variant="outline" className="gap-2">
                  <Camera className="h-4 w-4" /> Check In &amp; Add Your Photo
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ── CTA to registered events ───────────────── */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">
            Looking for organized events with registration?
          </p>
          <Link href="/events">
            <Button
              size="lg"
              className="gap-2"
              style={{ backgroundColor: "var(--brand-orange)" }}
            >
              View Upcoming Events
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
