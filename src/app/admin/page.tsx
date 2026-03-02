import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Bike, Users, Image, Download, Gift, Ticket, BarChart3, ClipboardList, Mail, Activity } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin | MMM Event OS" };

const adminCards = [
  {
    title: "Events",
    description: "Create and manage events.",
    icon: Calendar,
    href: "/admin/events",
  },
  {
    title: "Rides",
    description: "Manage ride series and occurrences.",
    icon: Bike,
    href: "/admin/rides",
  },
  {
    title: "Members",
    description: "View and manage org members.",
    icon: Users,
    href: "/admin/members",
  },
  {
    title: "Check-ins",
    description: "Review check-in photos.",
    icon: Image,
    href: "/admin/checkins",
  },
  {
    title: "Referrals",
    description: "Leaderboard, milestones, and referral codes.",
    icon: Gift,
    href: "/admin/referrals",
  },
  {
    title: "Raffles",
    description: "Raffle pools and ticket management.",
    icon: Ticket,
    href: "/admin/raffles",
  },
  {
    title: "Analytics",
    description: "Registration metrics and revenue breakdown.",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    title: "Event Day",
    description: "Command center for day-of operations.",
    icon: ClipboardList,
    href: "/admin/event-day",
  },
  {
    title: "Email",
    description: "Weekly ride email controls.",
    icon: Mail,
    href: "/admin/email",
  },
  {
    title: "Exports",
    description: "Download registration & emergency data.",
    icon: Download,
    href: "/admin/exports",
  },
  {
    title: "System",
    description: "Health checks, env status, and execution logs.",
    icon: Activity,
    href: "/admin/system",
  },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Hero
        title="Admin Dashboard"
        subtitle={`Signed in as ${user?.email}`}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {adminCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <card.icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
