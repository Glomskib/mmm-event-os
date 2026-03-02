"use client";

import { useEffect, useState } from "react";
import { Clock, Gift, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card
      className={`border-2 ${
        urgent
          ? "border-amber-400 bg-amber-50"
          : "border-emerald-300 bg-emerald-50"
      }`}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Gift
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              urgent ? "text-amber-600" : "text-emerald-600"
            }`}
          />
          <div className="flex-1">
            <p
              className={`text-sm font-semibold ${
                urgent ? "text-amber-900" : "text-emerald-900"
              }`}
            >
              {title}
            </p>
            <ul className="mt-2 space-y-1">
              {perks.map((perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-1.5 text-xs text-muted-foreground"
                >
                  <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2">
              <Badge
                variant={urgent ? "destructive" : "secondary"}
                className="text-xs"
              >
                <Clock className="mr-1 h-3 w-3" />
                {daysLeft === 0
                  ? "Last day!"
                  : daysLeft === 1
                    ? "1 day left"
                    : `${daysLeft} days left`}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Ends {formatDeadline(deadlineIso)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Gift className="h-3.5 w-3.5 shrink-0" />
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
