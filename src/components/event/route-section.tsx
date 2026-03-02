import type { MediaAsset } from "@/lib/media";
import { VideoEmbed } from "@/components/media/video-embed";
import { Map } from "lucide-react";

interface RouteSectionProps {
  assets: MediaAsset[];
}

/** Route preview images / embedded maps for event pages. */
export function RouteSection({ assets }: RouteSectionProps) {
  if (assets.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Map className="h-4 w-4" />
        Route
      </h2>
      <div className="space-y-3">
        {assets.map((asset) => {
          if (asset.kind === "image") {
            return (
              <div
                key={asset.id}
                className="overflow-hidden rounded-xl border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.title ?? "Route map"}
                  className="w-full object-contain"
                  loading="lazy"
                />
                {(asset.title || asset.caption) && (
                  <div className="px-4 py-2">
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
            );
          }
          return <VideoEmbed key={asset.id} asset={asset} />;
        })}
      </div>
    </div>
  );
}
