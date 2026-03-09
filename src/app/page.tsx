import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Heart,
  Users,
  Trophy,
  Bike,
  ArrowRight,
  HandHeart,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getHomepageSponsors } from "@/lib/media";
import { SponsorsSection } from "@/components/event/sponsors-section";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { slugify } from "@/lib/event-slug";

export default async function HomePage() {
  const supabase = await createClient();
  const org = await getCurrentOrg();
  const homepageSponsors = org ? await getHomepageSponsors(org.id) : [];

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true })
    .limit(6);

  const upcomingEvents = events ?? [];

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-slate) 50%, var(--brand-navy) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,166,35,0.12),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,166,35,0.06),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-3xl">
            <p
              className="mb-4 text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--brand-orange)" }}
            >
              501(c)(3) Nonprofit &middot; Northwest Ohio
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Every Mile
              <br />
              <span style={{ color: "var(--brand-orange)" }}>Matters.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Making Miles Matter brings people together to improve mental,
              physical, and emotional health. We help people push their limits,
              connect with nature and each other, and turn every mile into
              meaningful impact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/events">
                <Button size="lg" className="gap-2">
                  Browse Events <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/donate">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  <Heart className="h-4 w-4" /> Donate
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "2025 HHH Riders", value: "200+", icon: Users },
              { label: "2026 Events", value: "8+", icon: Calendar },
              { label: "2026 Goal", value: "400", icon: Trophy },
              { label: "Families Supported", value: "100+", icon: Heart },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center backdrop-blur-sm"
              >
                <stat.icon
                  className="mx-auto mb-2 h-5 w-5"
                  style={{ color: "var(--brand-orange)" }}
                />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-0.5 text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ──────────────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Upcoming Events
              </h2>
              <p className="mt-1 text-muted-foreground">
                Rides, fundraisers, and community gatherings.
              </p>
            </div>
            <Link
              href="/events"
              className="hidden text-sm font-medium text-primary hover:underline sm:block"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => {
              const eventSlug = event.slug ?? slugify(event.title);
              return (
                <Card key={event.id} className="group overflow-hidden">
                  {event.image_url && (
                    <Link href={`/events/${eventSlug}`}>
                      <div className="aspect-video overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                  )}
                  <CardHeader className="pb-2">
                    <Link href={`/events/${eventSlug}`}>
                      <CardTitle className="text-lg hover:underline">
                        {event.title}
                      </CardTitle>
                    </Link>
                    {event.description && (
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <Link href={`/register/${eventSlug}`}>
                      <Button className="mt-3 w-full" size="sm">
                        Register
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/events"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all events &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* ── Mission / Impact ──────────────────────────────────── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p
                className="mb-2 text-sm font-semibold uppercase tracking-widest"
                style={{ color: "var(--brand-orange)" }}
              >
                Our Mission
              </p>
              <h2 className="text-3xl font-bold tracking-tight">
                Building Community,
                <br />
                One Ride at a Time
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Making Miles Matter Inc. is a 501(c)(3) nonprofit based in
                Findlay, Ohio. We organize cycling events that bring people
                together and raise funds for families in need throughout Hancock
                County and beyond.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "100% of registration proceeds support local families",
                  "Free weekly group rides for all skill levels",
                  "Events for every rider — 15 to 100 miles",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white"
                      style={{ backgroundColor: "var(--brand-orange)" }}
                    >
                      ✓
                    </span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <Link href="/about">
                  <Button variant="outline" className="gap-2">
                    Learn More <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/volunteer">
                  <Button variant="outline" className="gap-2">
                    <HandHeart className="h-4 w-4" /> Volunteer
                  </Button>
                </Link>
              </div>
            </div>

            {/* Impact cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Heart,
                  title: "Meals Provided",
                  stat: "500+",
                  desc: "Families fed through event proceeds",
                },
                {
                  icon: Bike,
                  title: "Miles Ridden",
                  stat: "25K+",
                  desc: "Collective community miles",
                },
                {
                  icon: Users,
                  title: "Volunteers",
                  stat: "100+",
                  desc: "Community members giving their time",
                },
                {
                  icon: Trophy,
                  title: "Events Hosted",
                  stat: "30+",
                  desc: "Rides, fundraisers, and gatherings",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border bg-card p-5 text-center shadow-sm"
                >
                  <card.icon
                    className="mx-auto mb-2 h-6 w-6"
                    style={{ color: "var(--brand-orange)" }}
                  />
                  <p className="text-2xl font-bold">{card.stat}</p>
                  <p className="text-sm font-medium">{card.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            How You Can Make a Difference
          </h2>
          <p className="mt-2 text-muted-foreground">
            Whether you ride, volunteer, or donate — every action counts.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Register for an Event",
              description:
                "Pick a ride distance that works for you. We have options from 15 to 100 miles — plus free community rides every week.",
              href: "/events",
              cta: "Browse Events",
            },
            {
              step: "02",
              title: "Ride & Fundraise",
              description:
                "Share your referral link with friends. The more riders who join, the more families we can support. Top referrers earn prizes.",
              href: "/leaderboard",
              cta: "See Leaderboard",
            },
            {
              step: "03",
              title: "Celebrate the Impact",
              description:
                "Join the post-ride party, see the funds raised, and hear the stories of the families your miles are helping.",
              href: "/donate",
              cta: "Donate Now",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: "var(--brand-navy)" }}
              >
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                {item.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sponsors ──────────────────────────────────────────── */}
      {homepageSponsors.length > 0 && (
        <section className="border-t py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold">Our Sponsors</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These organizations make our mission possible.
              </p>
            </div>
            <SponsorsSection sponsors={homepageSponsors} />
            <div className="mt-6 text-center">
              <Link
                href="/sponsors"
                className="text-sm font-medium text-primary hover:underline"
              >
                Become a sponsor &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter + Donate CTA ───────────────────────────── */}
      <section
        className="border-t"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-slate) 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Stay in the Loop
              </h2>
              <p className="mt-2 text-white/70">
                Event updates, ride schedules, and community stories — straight
                to your inbox.
              </p>
              <div className="mt-6 max-w-md">
                <NewsletterSignup variant="footer" />
              </div>
            </div>
            <div className="text-center lg:text-right">
              <h2 className="text-2xl font-bold text-white">
                Support the Mission
              </h2>
              <p className="mt-2 text-white/70">
                Can&apos;t ride? You can still make miles matter.
              </p>
              <div className="mt-6">
                <Link href="/donate">
                  <Button
                    size="lg"
                    className="gap-2"
                    style={{
                      backgroundColor: "var(--brand-orange)",
                      color: "#fff",
                    }}
                  >
                    <Heart className="h-4 w-4" /> Make a Donation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
