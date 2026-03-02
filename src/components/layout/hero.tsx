import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeroProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function Hero({ title, subtitle, ctaLabel, ctaHref }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: "linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-slate) 100%)" }}
    >
      {/* Subtle texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,166,35,0.08),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            {subtitle}
          </p>
        )}
        {ctaLabel && ctaHref && (
          <div className="mt-8">
            <Link href={ctaHref}>
              <Button size="lg">{ctaLabel}</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
