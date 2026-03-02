import Link from "next/link";
import { Users, Route } from "lucide-react";

interface LegacyStripProps {
  riderCount: number;
  totalMiles: number;
}

/** HHH-only heritage strip. Navy/orange brand colors. */
export function LegacyStrip({ riderCount, totalMiles }: LegacyStripProps) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ backgroundColor: "var(--brand-navy)" }}
    >
      <p
        className="mb-3 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--brand-orange)" }}
      >
        Since 1974
      </p>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2 text-white">
          <Users className="h-4 w-4 shrink-0 opacity-70" />
          <span className="text-sm">
            <strong className="text-base font-bold">
              {riderCount.toLocaleString()}
            </strong>{" "}
            riders
          </span>
        </div>

        <div className="flex items-center gap-2 text-white">
          <Route className="h-4 w-4 shrink-0 opacity-70" />
          <span className="text-sm">
            <strong className="text-base font-bold">
              {totalMiles.toLocaleString()}
            </strong>{" "}
            total miles
          </span>
        </div>
      </div>

      <Link
        href="/hhh-legacy"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
        style={{ color: "var(--brand-orange)" }}
      >
        View the HHH Legacy →
      </Link>
    </div>
  );
}
