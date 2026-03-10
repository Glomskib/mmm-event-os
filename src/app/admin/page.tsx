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
  HandHeart,
  Heart,
  LayoutDashboard,
  LineChart,
  AlertTriangle,
  MapPin,
  Truck,
  ListChecks,
  DollarSign,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin" };

const adminCards = [
  {
    title: "Coordinator Dashboard",
    description: "Day-of ops, logistics, riders, volunteers.",
    icon: LayoutDashboard,
    href: "/admin/coordinator",
    color: "text-orange-600",
  },
  {
    title: "Executive Dashboard",
    description: "Revenue, growth, pipeline, impact metrics.",
    icon: LineChart,
    href: "/admin/executive",
    color: "text-green-600",
  },
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
    title: "Campaigns",
    description: "Email campaigns, subscribers, and broadcasts.",
    icon: Mail,
    href: "/admin/campaigns",
    color: "text-indigo-600",
  },
  {
    title: "Ride Email",
    description: "Weekly ride email controls.",
    icon: Mail,
    href: "/admin/email",
    color: "text-indigo-500",
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
  {
    title: "Volunteers",
    description: "View volunteer signups and contact info.",
    icon: HandHeart,
    href: "/admin/volunteers",
    color: "text-rose-500",
  },
  {
    title: "Donations",
    description: "Track donations and total raised.",
    icon: Heart,
    href: "/admin/donations",
    color: "text-red-500",
  },
  {
    title: "Task Board",
    description: "Track coordinator tasks and deadlines.",
    icon: ListChecks,
    href: "/admin/tasks",
    color: "text-amber-600",
  },
  {
    title: "Incidents",
    description: "Report and resolve event issues.",
    icon: AlertTriangle,
    href: "/admin/incidents",
    color: "text-red-600",
  },
  {
    title: "Logistics",
    description: "Event preparation checklist.",
    icon: ClipboardList,
    href: "/admin/logistics",
    color: "text-emerald-600",
  },
  {
    title: "Aid Stations",
    description: "Manage rest stops and support points.",
    icon: MapPin,
    href: "/admin/aid-stations",
    color: "text-teal-600",
  },
  {
    title: "SAG Vehicles",
    description: "Support vehicle assignments and status.",
    icon: Truck,
    href: "/admin/sag",
    color: "text-blue-700",
  },
  {
    title: "Volunteer Assignments",
    description: "Assign shifts and track hours.",
    icon: HandHeart,
    href: "/admin/volunteer-assignments",
    color: "text-rose-600",
  },
  {
    title: "Sponsor Deliverables",
    description: "Track what you owe sponsors.",
    icon: FileCheck,
    href: "/admin/sponsor-deliverables",
    color: "text-sky-600",
  },
  {
    title: "Financial Summary",
    description: "Event P&L and expense tracking.",
    icon: DollarSign,
    href: "/admin/financial",
    color: "text-green-700",
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
