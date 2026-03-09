import { Hero } from "@/components/layout/hero";
import { getOrgConfig } from "@/lib/org-config";
import {
  MapPin,
  CalendarDays,
  Clock,
  DollarSign,
  Film,
  Bike,
  Camera,
  Megaphone,
  Ticket,
  Gift,
  Heart,
  QrCode,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Wheels & Reels | Making Miles Matter" };

const MOVIE_OPTIONS = [
  {
    title: "Breaking Away",
    description:
      "A classic coming-of-age story about a small-town teenager obsessed with Italian cycling who takes on college rivals in a legendary race.",
  },
  {
    title: "Triplets of Belleville",
    description:
      "An animated, quirky French film following a grandmother on a wild rescue mission after her cyclist grandson is kidnapped during the Tour de France.",
  },
  {
    title: "Rising from Ashes",
    description:
      "An inspiring documentary about the first Rwandan national cycling team, built from the ashes of genocide with the help of an American coach.",
  },
  {
    title: "Pee-Wee's Big Adventure",
    description:
      "A fun, family-friendly romp where Pee-Wee Herman embarks on a cross-country quest to recover his beloved stolen bicycle.",
  },
  {
    title: "The Flying Scotsman",
    description:
      "The true story of Graeme Obree, a Scottish cyclist who built his own bike and broke the world hour record against all odds.",
  },
];

const RUN_OF_SHOW = [
  {
    time: "11:30 AM",
    label: "Doors Open",
    detail: "Concessions, bike parking, raffle tickets available",
  },
  {
    time: "12:00 PM",
    label: "Movie Starts",
    detail: "Grab your seat and enjoy the show",
  },
  {
    time: "1:45 PM",
    label: "Closing Remarks & Raffle Drawing",
    detail: "Winners announced live",
  },
  {
    time: "2:00 PM",
    label: "Event Ends",
    detail: "Thank you for supporting Making Miles Matter!",
  },
];

export default function WheelsAndReelsPage() {
  const org = getOrgConfig();

  return (
    <>
      {/* ── Hero ────────────────────────────────────── */}
      <Hero
        title="Wheels & Reels"
        subtitle="Movie Date with Your Bike — A bike & movie fundraiser for Making Miles Matter"
        ctaLabel="Register Now"
        ctaHref="/register/wheels-and-reels"
      />

      {/* ── Event Overview ──────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Date</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">May 2026</p>
              <p className="text-sm text-muted-foreground">Exact date TBD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Theater in North Baltimore, OH</p>
              <p className="text-sm text-muted-foreground">Close to {org.location}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">11:30 AM – 2:00 PM</p>
              <p className="text-sm text-muted-foreground">Doors open 11:30, movie at noon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Cost</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">$10 Suggested Donation</p>
              <p className="text-sm text-muted-foreground">Kids under 5 free</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Family-Friendly Event
          </Badge>
        </div>
      </section>

      {/* ── Run of Show ─────────────────────────────── */}
      <section
        className="py-16"
        style={{ background: "var(--brand-navy)", color: "white" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Run of Show
          </h2>
          <p className="mt-2 text-center text-white/60">
            Here&apos;s how the day unfolds
          </p>

          <ol className="relative mt-10 border-l-2 border-white/20 ml-4">
            {RUN_OF_SHOW.map((item, i) => (
              <li key={i} className="mb-10 ml-8 last:mb-0">
                <span
                  className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                >
                  <Clock className="h-3.5 w-3.5 text-white" />
                </span>
                <time className="mb-1 text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
                  {item.time}
                </time>
                <h3 className="text-lg font-semibold">{item.label}</h3>
                <p className="text-sm text-white/60">{item.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Movie Options ───────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Movie Options
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Five bike-themed films to choose from — the final pick will be voted
            on or selected before the event.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOVIE_OPTIONS.map((movie) => (
            <Card key={movie.title} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Film
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{ color: "var(--brand-primary)" }}
                  />
                  <div>
                    <CardTitle className="text-lg">{movie.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription>{movie.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── What to Expect ──────────────────────────── */}
      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            What to Expect
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            More than just a movie — it&apos;s a community experience.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--brand-primary)" }}
              >
                <Bike className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Bike Parking Display</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ride your bike to the theater and display it outside for
                  everyone to see.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--brand-primary)" }}
              >
                <Camera className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Photo Op</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Snap a photo at our backdrop featuring bikes and the{" "}
                  {org.name} logo.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--brand-primary)" }}
              >
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Pre-Show Spotlight</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A 5-minute intro about our mission and upcoming rides and
                  events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fundraising ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Fundraising
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          All proceeds support {org.name}&apos;s mission.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Tickets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                $10 suggested donation per person. Kids under 5 get in free.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Raffle</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Win cycling gear, gift cards, and {org.shortName} swag.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Concessions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Staffed by the theater — grab popcorn, drinks, and snacks.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                <CardTitle className="text-base">Direct Donations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Donation jars and QR codes available throughout the venue.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ background: "var(--brand-navy)" }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Roll?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Grab your helmet, pick a seat, and help {org.name} make every mile
            count. Registration opens soon — sign up to be notified.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register/wheels-and-reels">
              <Button size="lg" className="gap-1.5">
                Register Now
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`mailto:${org.contactEmail}`}>
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/40">
            This event can be repeated quarterly or monthly as an ongoing
            fundraiser. {org.name} is a {org.nonprofit.type} nonprofit.
          </p>
        </div>
      </section>
    </>
  );
}
