import { Hero } from "@/components/layout/hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Bike, Trophy, Film } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Events",
    description: "Discover and join community events near you.",
    icon: Calendar,
    href: "/events",
  },
  {
    title: "Group Rides",
    description: "Weekly group rides for all skill levels.",
    icon: Bike,
    href: "/rides",
  },
  {
    title: "Leaderboard",
    description: "Track your miles and climb the ranks.",
    icon: Trophy,
    href: "/leaderboard",
  },
  {
    title: "Wheels & Reels",
    description: "Watch highlights and ride recaps.",
    icon: Film,
    href: "/wheels-and-reels",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero
        title="Making Miles Matter"
        subtitle="Join our community of riders and event-goers. Every mile counts."
        ctaLabel="Browse Events"
        ctaHref="/events"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <feature.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Ready to ride?</h2>
          <p className="mt-2 text-muted-foreground">
            Create an account and start tracking your miles today.
          </p>
          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
