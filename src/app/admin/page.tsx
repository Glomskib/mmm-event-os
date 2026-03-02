import { Hero } from "@/components/layout/hero";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Bike,
  Users,
  Image,
  Download,
  Gift,
  Ticket,
  BarChart3,
  ClipboardList,
  Mail,
  Activity,
  ShieldCheck,
  Share2,
  Film,
  Rocket,
  Handshake,
  Camera,
  FileUp,
  Map,
  Trophy,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin | MMM Event OS" };

const adminCards = [
  {
    title: "Events",
    description: "Create and manage events.",
    icon: Calendar,
    href: "/admin/events",
    color: "text-blue-600",
  },
  {
    title: "Rides",
    description: "Manage ride series and occurrences.",
    icon: Bike,
    href: "/admin/rides",
    color: "text-emerald-600",
  },
  {
    title: "Routes",
    description: "Set per-occurrence route URLs and embed maps.",
    icon: Map,
    href: "/admin/routes",
    color: "text-emerald-700",
  },
  {
    title: "Members",
    description: "View and manage org members.",
    icon: Users,
    href: "/admin/members",
    color: "text-violet-600",
  },
  {
    title: "Check-ins",
    description: "Review check-in photos.",
    icon: Image,
    href: "/admin/checkins",
    color: "text-amber-600",
  },
  {
    title: "Referrals",
    description: "Leaderboard, milestones, and referral codes.",
    icon: Gift,
    href: "/admin/referrals",
    color: "text-pink-600",
  },
  {
    title: "Raffles",
    description: "Raffle pools and ticket management.",
    icon: Ticket,
    href: "/admin/raffles",
    color: "text-orange-600",
  },
  {
    title: "Analytics",
    description: "Registration metrics and revenue breakdown.",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "text-cyan-600",
  },
  {
    title: "Event Day",
    description: "Command center for day-of operations.",
    icon: ClipboardList,
    href: "/admin/event-day",
    color: "text-red-600",
  },
  {
    title: "Social",
    description: "Create social post drafts for approval.",
    icon: Share2,
    href: "/admin/social",
    color: "text-fuchsia-600",
  },
  {
    title: "Approvals",
    description: "Review and approve emails and content.",
    icon: ShieldCheck,
    href: "/admin/approvals",
    color: "text-yellow-600",
  },
  {
    title: "Email",
    description: "Weekly ride email controls.",
    icon: Mail,
    href: "/admin/email",
    color: "text-indigo-600",
  },
  {
    title: "Exports",
    description: "Download registration & emergency data.",
    icon: Download,
    href: "/admin/exports",
    color: "text-teal-600",
  },
  {
    title: "Wheels & Reels",
    description: "Manage films and monthly voting.",
    icon: Film,
    href: "/admin/wheels-and-reels",
    color: "text-rose-600",
  },
  {
    title: "System",
    description: "Health checks, env status, and execution logs.",
    icon: Activity,
    href: "/admin/system",
    color: "text-slate-600",
  },
  {
    title: "Launch Checklist",
    description: "Pre-launch readiness checks for go-live.",
    icon: Rocket,
    href: "/admin/launch",
    color: "text-lime-600",
  },
  {
    title: "Sponsors",
    description: "Track sponsors, contacts, and deals.",
    icon: Handshake,
    href: "/admin/sponsors",
    color: "text-sky-600",
  },
  {
    title: "Media",
    description: "Upload photos, videos, and embeds for events.",
    icon: Camera,
    href: "/admin/media",
    color: "text-primary",
  },
  {
    title: "HHH Import",
    description: "Import Shopify order CSV for HHH legacy leaderboard.",
    icon: FileUp,
    href: "/admin/hhh-import",
    color: "text-emerald-700",
  },
  {
    title: "Jersey Voting",
    description: "Manage jersey designs and view voting results.",
    icon: Trophy,
    href: "/admin/jersey",
    color: "text-amber-600",
  },
];

export default async function AdminPage() {
  return (
    <>
      <Hero title="Admin Dashboard" subtitle="Manage your organization" />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {adminCards.map((card) => (
            <Link key={card.href} href={card.href} className="group">
              <Card className="h-full transition-all duration-200 hover:shadow-md group-hover:-translate-y-0.5">
                <CardHeader>
                  <card.icon
                    className={`mb-3 h-8 w-8 ${card.color} transition-transform group-hover:scale-110`}
                  />
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
