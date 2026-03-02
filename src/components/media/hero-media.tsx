import type { MediaAsset } from "@/lib/media";

interface HeroMediaProps {
  asset: MediaAsset;
  eventTitle: string;
}

/** Full-width hero image or video for event detail pages. */
export function HeroMedia({ asset, eventTitle }: HeroMediaProps) {
  if (asset.kind === "image") {
    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt={asset.title ?? eventTitle}
          className="h-64 w-full object-cover sm:h-80 lg:h-96"
        />
        {(asset.title || asset.caption) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
            {asset.title && (
              <p className="text-sm font-semibold text-white">{asset.title}</p>
            )}
            {asset.caption && (
              <p className="text-xs text-white/80">{asset.caption}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (asset.kind === "video") {
    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black">
        <video
          src={asset.url}
          controls
          className="h-64 w-full object-cover sm:h-80 lg:h-96"
          poster={asset.thumb_url ?? undefined}
        />
      </div>
    );
  }

  // embed kind in hero — render as responsive iframe
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      <div className="relative pt-[56.25%]">
        <iframe
          src={asset.url}
          title={asset.title ?? eventTitle}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
