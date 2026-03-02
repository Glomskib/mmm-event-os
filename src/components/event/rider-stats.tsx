import { Users } from "lucide-react";
import type { RegistrationStats } from "@/lib/registration-stats";

interface RiderStatsProps {
  stats: RegistrationStats;
  /** When false, progress bar and "spots remaining" are suppressed. */
  registrationOpen: boolean;
  /**
   * inline — self-contained navy pill, sits anywhere on the page.
   * full   — transparent bg, designed to sit inside a dark container (e.g. CTABand).
   */
  variant?: "inline" | "full";
}

export function RiderStats({
  stats,
  registrationOpen,
  variant = "inline",
}: RiderStatsProps) {
  const { total_registered, capacity, spots_remaining } = stats;
  const showUrgency =
    registrationOpen && capacity !== null && spots_remaining !== null;
  const pct =
    capacity && capacity > 0
      ? Math.min(100, Math.round((total_registered / capacity) * 100))
      : 0;

  if (variant === "inline") {
    return (
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3"
        style={{ backgroundColor: "var(--brand-navy)" }}
      >
        <div className="flex items-center gap-1.5">
          <Users
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--brand-orange)" }}
          />
          <span className="text-sm font-semibold text-white">
            {total_registered.toLocaleString()} Riders Registered
          </span>
        </div>
        {showUrgency && (
          <span className="text-sm text-white/60">
            · {spots_remaining!.toLocaleString()} Spots Remaining
          </span>
        )}
      </div>
    );
  }

  // full variant — no background, white text for dark parent
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--brand-orange)" }}
          />
          <span className="text-sm font-semibold text-white">
            {total_registered.toLocaleString()} Riders Registered
          </span>
        </div>
        {showUrgency && (
          <span className="text-xs text-white/60">
            {spots_remaining!.toLocaleString()} remaining
          </span>
        )}
      </div>
      {showUrgency && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: "var(--brand-orange)",
            }}
          />
        </div>
      )}
    </div>
  );
}
