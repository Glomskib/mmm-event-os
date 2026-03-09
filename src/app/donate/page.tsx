import { Hero } from "@/components/layout/hero";
import { DonationForm } from "./donation-form";
import { Heart } from "lucide-react";
import { getOrgConfig } from "@/lib/org-config";

export const metadata = { title: "Donate" };

const impactTiers = [
  { amount: 25, label: "$25", impact: "Covers route marking supplies for a community ride" },
  { amount: 50, label: "$50", impact: "Stocks a rest stop with water and nutrition for riders" },
  { amount: 85, label: "$85", impact: "Provides SAG wagon support for an event" },
  { amount: 150, label: "$150", impact: "Sponsors a rider's full event registration and gear" },
  { amount: 250, label: "$250", impact: "Funds a new community cycling event from start to finish" },
  { amount: 500, label: "$500", impact: "Community Sponsor — your name on signage, website, and jerseys" },
];

export default function DonatePage() {
  const org = getOrgConfig();
  return (
    <>
      <Hero
        title="Support the Mission"
        subtitle="Can't ride? You can still make miles matter. Every dollar fuels community rides, cycling events, and grassroots health initiatives in Northwest Ohio."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Impact context */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <Heart
                className="h-6 w-6"
                style={{ color: "var(--brand-orange)" }}
              />
              <h2 className="text-xl font-bold">Your Impact</h2>
            </div>
            <p className="mb-6 text-muted-foreground">
              {org.name} is a registered {org.nonprofit.type} nonprofit. All
              donations are tax-deductible. Your contribution directly funds
              community rides, cycling events, route infrastructure, and
              programs that bring people together through cycling — no
              overhead, no middlemen.
            </p>
            <div className="space-y-3">
              {impactTiers.map((tier) => (
                <div
                  key={tier.amount}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <span
                    className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--brand-navy)" }}
                  >
                    {tier.label}
                  </span>
                  <p className="text-sm text-muted-foreground">{tier.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Donation form */}
          <div>
            <DonationForm />
          </div>
        </div>
      </section>
    </>
  );
}
