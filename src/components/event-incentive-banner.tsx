"use client";

import { useEffect, useState } from "react";
import { Clock, Users, Zap } from "lucide-react";

interface EventIncentiveBannerProps {
  title: string;
  deadline: Date;
  perks: string[];
  eventSlug: string;
  registeredCount?: number;
}

function getDaysRemaining(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function EventIncentiveBanner({
  title,
  deadline,
  perks,
  registeredCount,
}: EventIncentiveBannerProps) {
  const [daysLeft, setDaysLeft] = useState(() => getDaysRemaining(deadline));
  const [visible, setVisible] = useState(() => new Date() < deadline);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      const remaining = getDaysRemaining(deadline);
      setDaysLeft(remaining);
      if (remaining <= 0) setVisible(false);
    }, 60_000);
    return () => clearInterval(interval);
  }, [deadline, visible]);

  if (!visible) return null;

  const urgent = daysLeft <= 7;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        urgent
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-blue-200 bg-blue-50 text-blue-900"
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        <Zap className="h-4 w-4 shrink-0" />
        <span>{title}</span>
      </div>

      <ul className="mt-1.5 space-y-0.5 pl-6 text-xs">
        {perks.map((perk) => (
          <li key={perk} className="list-disc">{perk}</li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {daysLeft === 0
            ? "Last day!"
            : daysLeft === 1
              ? "1 day left"
              : `${daysLeft} days left`}
        </span>

        {registeredCount != null && registeredCount > 0 && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {registeredCount} rider{registeredCount !== 1 ? "s" : ""} registered
          </span>
        )}
      </div>
    </div>
  );
}
