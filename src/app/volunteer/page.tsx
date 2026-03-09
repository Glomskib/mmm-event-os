import { Hero } from "@/components/layout/hero";
import { VolunteerForm } from "./volunteer-form";
import { HandHeart, Users, Clock, Award } from "lucide-react";
import { getOrgConfig } from "@/lib/org-config";

export const metadata = { title: "Volunteer" };

export default function VolunteerPage() {
  const org = getOrgConfig();
  return (
    <>
      <Hero
        title="Volunteer With Us"
        subtitle="Our events don't happen without people like you. Join 100+ volunteers making a difference."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Why volunteer */}
          <div>
            <h2 className="text-2xl font-bold">Why Volunteer?</h2>
            <p className="mt-3 text-muted-foreground">
              Volunteering at a {org.name} event means you&apos;re
              directly helping families in Hancock County. Plus, it&apos;s a
              great time.
            </p>

            <div className="mt-8 space-y-5">
              {[
                {
                  icon: HandHeart,
                  title: "Direct Impact",
                  desc: "You're the reason riders feel safe, supported, and welcomed at every mile.",
                },
                {
                  icon: Users,
                  title: "Community",
                  desc: "Meet fellow community members who care about making a difference.",
                },
                {
                  icon: Clock,
                  title: "Flexible Shifts",
                  desc: "Morning, afternoon, or full day — pick the shift that works for you.",
                },
                {
                  icon: Award,
                  title: "Volunteer Perks",
                  desc: "Free event t-shirt, meals, raffle entries, and our eternal gratitude.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--brand-navy)" }}
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border bg-muted/30 p-5">
              <h3 className="font-semibold">Volunteer Roles Needed</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {[
                  "Registration desk",
                  "Rest stop support",
                  "Course marshals",
                  "SAG drivers",
                  "Photography",
                  "Post-ride party setup",
                  "Raffle management",
                  "Check-in stations",
                ].map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: "var(--brand-orange)" }}
                    />
                    {role}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <VolunteerForm />
          </div>
        </div>
      </section>
    </>
  );
}
