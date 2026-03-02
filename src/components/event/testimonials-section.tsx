import type { MediaAsset } from "@/lib/media";
import { Quote } from "lucide-react";

interface TestimonialsSectionProps {
  assets: MediaAsset[];
}

/**
 * Testimonial cards.
 * Asset title = rider name, caption = quote text.
 * For image assets, the image is shown alongside the quote.
 */
export function TestimonialsSection({ assets }: TestimonialsSectionProps) {
  if (assets.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        What Riders Say
      </h2>
      <div className="space-y-3">
        {assets.map((asset) => (
          <TestimonialCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ asset }: { asset: MediaAsset }) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
      {asset.kind === "image" && asset.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.title ?? "Rider"}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      )}
      <div className="min-w-0">
        <Quote
          className="mb-1 h-4 w-4 text-muted-foreground/50"
          aria-hidden
        />
        {asset.caption && (
          <p className="text-sm text-muted-foreground">{asset.caption}</p>
        )}
        {asset.title && (
          <p className="mt-2 text-xs font-medium text-foreground">
            — {asset.title}
          </p>
        )}
      </div>
    </div>
  );
}
