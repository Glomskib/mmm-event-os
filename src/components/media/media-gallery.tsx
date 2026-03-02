import type { MediaAsset } from "@/lib/media";

interface MediaGalleryProps {
  assets: MediaAsset[];
}

/** Responsive photo/video grid for event gallery sections. */
export function MediaGallery({ assets }: MediaGalleryProps) {
  if (assets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset) => (
        <GalleryItem key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function GalleryItem({ asset }: { asset: MediaAsset }) {
  const isVideo = asset.kind === "video" || asset.kind === "embed";

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-muted">
      {asset.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.title ?? "Event photo"}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {asset.kind === "video" && (
        <video
          src={asset.url}
          className="aspect-square w-full object-cover"
          poster={asset.thumb_url ?? undefined}
          muted
          playsInline
          preload="metadata"
        />
      )}

      {asset.kind === "embed" && (
        <div className="relative aspect-square bg-black">
          <div className="relative pt-[100%]">
            <iframe
              src={asset.url}
              title={asset.title ?? "Video"}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Caption overlay */}
      {(asset.title || asset.caption) && (
        <div
          className={`${
            isVideo ? "relative" : "absolute bottom-0 left-0 right-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0"
          } bg-gradient-to-t from-black/70 to-transparent px-3 py-2`}
        >
          {asset.title && (
            <p className="text-xs font-medium text-white">{asset.title}</p>
          )}
          {asset.caption && (
            <p className="text-[11px] text-white/70">{asset.caption}</p>
          )}
        </div>
      )}
    </div>
  );
}
