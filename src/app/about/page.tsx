import { Hero } from "@/components/layout/hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Bike, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getOrgConfig } from "@/lib/org-config";

export const metadata = { title: "About" };

const team = [
  {
    name: "Brandon Glomski",
    role: "Director",
    responsibilities:
      "Marketing, sponsors, website, finances, advertising",
  },
  {
    name: "Joshua Herod",
    role: "Course Director",
    responsibilities: "Routes, rest stops, SAG support, course marking, logistics",
  },
  {
    name: "Timothy Brown",
    role: "Rider Experience",
    responsibilities:
      "Volunteers, registration, merchandise, raffle, rider experience",
  },
];

export default function AboutPage() {
  const org = getOrgConfig();
  return (
    <>
      <Hero
        title={`About ${org.name}`}
        subtitle={`A ${org.nonprofit.type} nonprofit building community through cycling in Northwest Ohio.`}
      />

      {/* Story */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-none">
          <h2 className="text-2xl font-bold tracking-tight">Our Story</h2>
          <p className="mt-4 text-lg font-medium italic text-foreground/80">
            &ldquo;{org.mission}&rdquo;
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Founded in {org.location}, {org.name} Inc. is a {org.nonprofit.type}
            {" "}nonprofit at the intersection of cycling culture, nonprofit
            fundraising, community health, and local business partnerships. We
            organize events that bring people together — from our flagship
            Hancock Horizontal Hundred gravel century to weekly Saturday shop
            rides at False Chord Brewing.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our 2025 HHH drew over 200 riders. In 2026, we&apos;re expanding
            with new events: the Findlay Further Fondo brewery-to-brewery spring
            ride, Wheels &amp; Reels cycling film nights, Ride to the Movies
            community rides, and more — all while growing our impact for
            families in Hancock County.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            100% of event registration proceeds go directly to supporting local
            families. We partner with local businesses like Further Bikes, False
            Chord Brewing, and Arlyn&apos;s Good Beer to anchor our events in
            the community we serve.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold">
            What We Stand For
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Heart,
                title: "Impact First",
                desc: "Every dollar raised supports families in Hancock County. No overhead, no red tape.",
              },
              {
                icon: Users,
                title: "Inclusive Community",
                desc: "Whether you ride 15 miles or 100, you belong here. All ages, all levels.",
              },
              {
                icon: Bike,
                title: "Love of Cycling",
                desc: "We believe bikes have the power to connect people, build health, and create joy.",
              },
              {
                icon: MapPin,
                title: "Local Roots",
                desc: "Born in Findlay, Ohio. We support the community that supports us.",
              },
            ].map((v) => (
              <Card key={v.title} className="text-center">
                <CardContent className="pt-6">
                  <v.icon
                    className="mx-auto mb-3 h-8 w-8"
                    style={{ color: "var(--brand-orange)" }}
                  />
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold">
          Meet the Team
        </h2>
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {team.map((member) => (
            <Card key={member.name} className="text-center">
              <CardContent className="pt-6">
                <div
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                  style={{ backgroundColor: "var(--brand-navy)" }}
                >
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-orange)" }}
                >
                  {member.role}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {member.responsibilities}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="border-t py-16"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-slate) 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white">
            Ready to Make Your Miles Matter?
          </h2>
          <p className="mt-3 text-white/70">
            Join hundreds of riders making a difference in our community.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/events">
              <Button size="lg" className="gap-2">
                Browse Events <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/volunteer">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Volunteer
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
