import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { getActiveSponsors } from "@/lib/media";
import { SponsorsSection } from "@/components/event/sponsors-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HandHeart, Users, Globe, Award } from "lucide-react";
import Link from "next/link";
import { getOrgConfig } from "@/lib/org-config";

export const metadata = { title: "Sponsors" };

const sponsorBenefits = [
  {
    icon: Users,
    title: "Reach 400+ Riders",
    desc: "Your brand in front of our engaged cycling community at every event, ride, and online.",
  },
  {
    icon: Globe,
    title: "Website Visibility",
    desc: `Logo on ${getOrgConfig().domain}, event pages, and all digital marketing materials.`,
  },
  {
    icon: Award,
    title: "Event Presence",
    desc: "Banner placement, rest stop branding, swag bag inclusion, and post-ride party visibility.",
  },
  {
    icon: HandHeart,
    title: "Community Impact",
    desc: `Direct association with a ${getOrgConfig().nonprofit.type} supporting families in need. Tax-deductible.`,
  },
];

const tiers = [
  {
    name: "Title Sponsor",
    price: "$2,500+",
    perks: [
      "Exclusive top billing at all events",
      "Logo on all jerseys and materials",
      "Speaking slot at post-ride party",
      "Social media feature campaign",
      "10 complimentary registrations",
    ],
  },
  {
    name: "Gold Sponsor",
    price: "$1,000",
    perks: [
      "Logo on event signage and website",
      "Rest stop branding rights",
      "Social media mentions",
      "5 complimentary registrations",
    ],
  },
  {
    name: "Silver Sponsor",
    price: "$500",
    perks: [
      "Logo on website and event program",
      "Social media mention",
      "2 complimentary registrations",
    ],
  },
  {
    name: "Community Sponsor",
    price: "$250",
    perks: [
      "Logo on website",
      "Event day recognition",
      "1 complimentary registration",
    ],
  },
];

export default async function SponsorsPage() {
  const orgConfig = getOrgConfig();
  const org = await getCurrentOrg();
  const sponsors = org ? await getActiveSponsors(org.id) : [];

  return (
    <>
      <Hero
        title="Become a Sponsor"
        subtitle={`Partner with ${orgConfig.name} and reach 400+ engaged community members while supporting families in need.`}
      />

      {/* Why sponsor */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">Why Partner With Us?</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sponsorBenefits.map((b) => (
            <Card key={b.title} className="text-center">
              <CardContent className="pt-6">
                <b.icon
                  className="mx-auto mb-3 h-8 w-8"
                  style={{ color: "var(--brand-orange)" }}
                />
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sponsorship tiers */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold">Sponsorship Tiers</h2>
            <p className="mt-2 text-muted-foreground">
              All sponsorships are tax-deductible contributions to a {orgConfig.nonprofit.type}.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier, i) => (
              <Card
                key={tier.name}
                className={`relative overflow-hidden ${i === 0 ? "ring-2 ring-primary" : ""}`}
              >
                {i === 0 && (
                  <div
                    className="py-1 text-center text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--brand-orange)" }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <CardContent className="pt-6">
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: "var(--brand-orange)" }}
                  >
                    {tier.price}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {tier.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: "var(--brand-orange)" }}
                        />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="mb-4 text-muted-foreground">
              Interested in sponsoring? We&apos;d love to hear from you.
            </p>
            <Link href={`mailto:${orgConfig.contactEmail}`}>
              <Button size="lg" className="gap-2">
                Contact Us About Sponsorship
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Current sponsors */}
      {sponsors.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold">Our Current Sponsors</h2>
              <p className="mt-2 text-muted-foreground">
                Thank you to the organizations that make our mission possible.
              </p>
            </div>
            <SponsorsSection sponsors={sponsors} />
          </div>
        </section>
      )}
    </>
  );
}
