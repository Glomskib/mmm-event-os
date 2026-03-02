import type { MediaAsset } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Map, TrendingUp, Droplets, Layers, Bike, Download } from "lucide-react";

interface RouteSectionProps {
  /** Distance option labels from pricing config (e.g. ["15 miles", "30 miles"]). */
  distances: string[];
  elevationGain: number | null;
  aidStations: number | null;
  terrainType: string | null;
  /** Elevation profile images — placement=elevation_chart. */
  elevationChartAssets: MediaAsset[];
  /** Embedded map iframes — placement=route_embed. */
  routeEmbedAssets: MediaAsset[];
  /** GPX file assets — placement=route_gpx. */
  gpxAssets: MediaAsset[];
  /** Legacy placement=route_preview assets (backward compat). */
  legacyPreviewAssets: MediaAsset[];
}

export function RouteSection({
  distances,
  elevationGain,
  aidStations,
  terrainType,
  elevationChartAssets,
  routeEmbedAssets,
  gpxAssets,
  legacyPreviewAssets,
}: RouteSectionProps) {
  const hasStats =
    distances.length > 0 ||
    elevationGain !== null ||
    aidStations !== null ||
    terrainType !== null;

  const chartAsset = elevationChartAssets[0] ?? null;
  const embedAsset = routeEmbedAssets[0] ?? null;
  const gpxAsset = gpxAssets[0] ?? null;

  const hasMedia =
    chartAsset !== null ||
    embedAsset !== null ||
    gpxAsset !== null ||
    legacyPreviewAssets.length > 0;

  if (!hasStats && !hasMedia) return null;

  const hasBothChartAndEmbed = chartAsset !== null && embedAsset !== null;

  return (
    <div className="space-y-4">
      {/* Section title */}
      <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
        <Map className="h-5 w-5" />
        The Route
      </h2>

      {/* Stat row */}
      {hasStats && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-border bg-card px-4 py-4 sm:grid-cols-4">
          {distances.length > 0 && (
            <StatChip
              icon={Bike}
              label="Distance"
              value={distances.join(" · ")}
            />
          )}
          {elevationGain !== null && (
            <StatChip
              icon={TrendingUp}
              label="Elevation Gain"
              value={`${elevationGain.toLocaleString()} ft`}
            />
          )}
          {aidStations !== null && (
            <StatChip
              icon={Droplets}
              label="Aid Stations"
              value={String(aidStations)}
            />
          )}
          {terrainType !== null && (
            <StatChip
              icon={Layers}
              label="Terrain"
              value={terrainType}
            />
          )}
        </div>
      )}

      {/* Elevation chart + embed map: side-by-side on sm+, stacked on mobile */}
      {(chartAsset || embedAsset) && (
        <div
          className={`grid gap-4 ${
            hasBothChartAndEmbed ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {chartAsset && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chartAsset.url}
                alt={chartAsset.title ?? "Elevation profile"}
                className="w-full object-contain"
                loading="lazy"
              />
              {(chartAsset.title || chartAsset.caption) && (
                <div className="border-t border-border px-4 py-2">
                  {chartAsset.title && (
                    <p className="text-xs font-medium text-foreground">
                      {chartAsset.title}
                    </p>
                  )}
                  {chartAsset.caption && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {chartAsset.caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {embedAsset && (
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
              <div className="relative pt-[56.25%]">
                <iframe
                  src={embedAsset.url}
                  title={embedAsset.title ?? "Route map"}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              {(embedAsset.title || embedAsset.caption) && (
                <div className="border-t border-border bg-card px-4 py-2">
                  {embedAsset.title && (
                    <p className="text-xs font-medium text-foreground">
                      {embedAsset.title}
                    </p>
                  )}
                  {embedAsset.caption && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {embedAsset.caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legacy route_preview assets (backward compat) */}
      {legacyPreviewAssets.length > 0 && (
        <div className="space-y-3">
          {legacyPreviewAssets.map((asset) =>
            asset.kind === "image" ? (
              <div
                key={asset.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.title ?? "Route map"}
                  className="w-full object-contain"
                  loading="lazy"
                />
                {(asset.title || asset.caption) && (
                  <div className="border-t border-border px-4 py-2">
                    {asset.title && (
                      <p className="text-xs font-medium text-foreground">
                        {asset.title}
                      </p>
                    )}
                    {asset.caption && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {asset.caption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // video or embed
              <div
                key={asset.id}
                className="overflow-hidden rounded-xl border border-border shadow-sm"
              >
                <div className="relative pt-[56.25%]">
                  {asset.kind === "embed" ? (
                    <iframe
                      src={asset.url}
                      title={asset.title ?? "Route"}
                      className="absolute inset-0 h-full w-full"
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={asset.url}
                      controls
                      className="absolute inset-0 h-full w-full object-cover"
                      poster={asset.thumb_url ?? undefined}
                    />
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* GPX download — brand orange, opens in new tab */}
      {gpxAsset && (
        <Button
          asChild
          style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
          className="hover:opacity-90"
        >
          <a
            href={gpxAsset.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-4 w-4" />
            Download GPX
          </a>
        </Button>
      )}
    </div>
  );
}

// ─── StatChip ────────────────────────────────────────────────────────────────

interface StatChipProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatChip({ icon: Icon, label, value }: StatChipProps) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
