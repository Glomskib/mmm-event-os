import { Navigation } from "lucide-react";

interface RouteButtonsProps {
  ridewithgps?: string | null;
  strava?: string | null;
  wahoo?: string | null;
}

/**
 * Inline route link buttons for RideWithGPS, Strava, and Wahoo.
 * Returns null if no URLs are provided.
 */
export function RouteButtons({ ridewithgps, strava, wahoo }: RouteButtonsProps) {
  const links = [
    {
      label: "RideWithGPS",
      url: ridewithgps,
      color:
        "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    },
    {
      label: "Strava",
      url: strava,
      color:
        "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    },
    {
      label: "Wahoo",
      url: wahoo,
      color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url!}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium transition-colors ${l.color}`}
        >
          <Navigation className="h-3 w-3" />
          {l.label}
        </a>
      ))}
    </div>
  );
}
