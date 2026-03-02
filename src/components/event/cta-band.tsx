import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bike } from "lucide-react";
import { RiderStats } from "@/components/event/rider-stats";
import type { RegistrationStats } from "@/lib/registration-stats";

interface CTABandProps {
  eventSlug: string;
  /** User's cumulative HHH miles, or null if not authenticated / no history. */
  userMiles: number | null;
  stats: RegistrationStats;
  registrationOpen: boolean;
}

/** Mid-page CTA band for HHH events. Navy background, orange accents. */
export function CTABand({
  eventSlug,
  userMiles,
  stats,
  registrationOpen,
}: CTABandProps) {
  return (
    <div
      className="rounded-xl px-6 py-8 text-center"
      style={{ backgroundColor: "var(--brand-navy)" }}
    >
      <Bike
        className="mx-auto mb-3 h-8 w-8"
        style={{ color: "var(--brand-orange)" }}
      />
      <h2 className="text-xl font-bold text-white">
        Ride the 2026 Hancock Horizontal Hundred
      </h2>

      {userMiles !== null && userMiles > 0 && (
        <p className="mt-2 text-sm text-white/70">
          You&apos;ve ridden{" "}
          <strong className="text-white">
            {userMiles.toLocaleString()} HHH miles
          </strong>{" "}
          — keep the streak alive.
        </p>
      )}

      {/* Rider count + progress bar above register button */}
      <div className="mx-auto mt-5 max-w-xs">
        <RiderStats
          stats={stats}
          registrationOpen={registrationOpen}
          variant="full"
        />
      </div>

      <Link href={`/register/${eventSlug}`} className="mt-5 inline-block">
        <Button
          size="lg"
          style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
        >
          Register Now
        </Button>
      </Link>
    </div>
  );
}
