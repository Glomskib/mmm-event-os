import type { MediaAsset } from "@/lib/media";

interface VideoEmbedProps {
  asset: MediaAsset;
}

/** Standalone video/embed renderer for the Highlights section. */
export function VideoEmbed({ asset }: VideoEmbedProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      {asset.kind === "video" ? (
        <video
          src={asset.url}
          controls
          className="w-full"
          poster={asset.thumb_url ?? undefined}
          preload="metadata"
        />
      ) : (
        // embed kind — 16:9 responsive iframe
        <div className="relative pt-[56.25%]">
          <iframe
            src={asset.url}
            title={asset.title ?? "Video highlight"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {(asset.title || asset.caption) && (
        <div className="px-4 py-3">
          {asset.title && (
            <p className="text-sm font-medium text-foreground">{asset.title}</p>
          )}
          {asset.caption && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {asset.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
