"use client";

import { useEffect, useState } from "react";
import { Clock, Gift, ChevronRight } from "lucide-react";

interface EventIncentiveBannerProps {
  title: string;
  perks: string[];
  deadlineIso: string;
  eventSlug: string;
}

function getDaysRemaining(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

/** Full-size incentive banner for event detail pages. */
export function MarketingIncentiveBanner({
  title,
  perks,
  deadlineIso,
}: EventIncentiveBannerProps) {
  const [daysLeft, setDaysLeft] = useState(() => getDaysRemaining(deadlineIso));
  const [visible, setVisible] = useState(
    () => Date.now() < new Date(deadlineIso).getTime()
  );

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      const remaining = getDaysRemaining(deadlineIso);
      setDaysLeft(remaining);
      if (remaining <= 0) setVisible(false);
    }, 60_000);
    return () => clearInterval(interval);
  }, [deadlineIso, visible]);

  if (!visible) return null;

  const urgent = daysLeft <= 7;

  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        urgent
          ? "border-primary/60 bg-primary/8"
          : "border-primary/25 bg-primary/5"
      }`}
      style={urgent ? { backgroundColor: "color-mix(in srgb, var(--brand-orange) 10%, white)" } : { backgroundColor: "color-mix(in srgb, var(--brand-orange) 5%, white)" }}
    >
      <div className="flex items-start gap-3">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <ul className="mt-2 space-y-1">
            {perks.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-1.5 text-xs text-muted-foreground"
              >
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                {perk}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                urgent
                  ? "bg-primary text-primary-foreground"
                  : "border border-primary/40 text-primary bg-transparent"
              }`}
            >
              <Clock className="h-3 w-3" />
              {daysLeft === 0
                ? "Last day!"
                : daysLeft === 1
                  ? "1 day left"
                  : `${daysLeft} days left`}
            </span>
            <span className="text-xs text-muted-foreground">
              Ends {formatDeadline(deadlineIso)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact inline snippet for event listing cards. */
export function MarketingIncentiveSnippet({
  title,
  deadlineIso,
}: {
  title: string;
  deadlineIso: string;
}) {
  const [daysLeft, setDaysLeft] = useState(() => getDaysRemaining(deadlineIso));
  const [visible, setVisible] = useState(
    () => Date.now() < new Date(deadlineIso).getTime()
  );

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      const remaining = getDaysRemaining(deadlineIso);
      setDaysLeft(remaining);
      if (remaining <= 0) setVisible(false);
    }, 60_000);
    return () => clearInterval(interval);
  }, [deadlineIso, visible]);

  if (!visible) return null;

  const urgent = daysLeft <= 7;

  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs font-medium ${
        urgent
          ? "border-primary/50 text-foreground"
          : "border-primary/25 text-foreground"
      }`}
      style={{ backgroundColor: urgent
        ? "color-mix(in srgb, var(--brand-orange) 10%, white)"
        : "color-mix(in srgb, var(--brand-orange) 5%, white)" }}
    >
      <div className="flex items-center gap-1.5">
        <Gift className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="line-clamp-2">{title}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {daysLeft === 0
          ? "Last day!"
          : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}{" "}
        &middot; Ends {formatDeadline(deadlineIso)}
      </p>
    </div>
  );
}
