"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MILESTONE_TIERS, getMilestoneProgress } from "@/lib/referrals";

type UserRankData = {
  code: string;
  referralCount: number;
  rank: number | null;
  unlockedTiers: string[];
};

export function UserRankCard({ data }: { data: UserRankData }) {
  const [copied, setCopied] = useState(false);
  const { code, referralCount, rank, unlockedTiers } = data;
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/events?ref=${code}`
      : `?ref=${code}`;

  const { nextTier, progress } = getMilestoneProgress(referralCount);

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Referrals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Your referral link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{referralCount}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{rank ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Rank</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{unlockedTiers.length}</p>
            <p className="text-xs text-muted-foreground">Rewards</p>
          </div>
        </div>

        {/* Progress bar */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Next: {nextTier.label}
              </span>
              <span className="font-medium">
                {progress.current}/{progress.target}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(progress.pct, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestone badges */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Milestones
          </p>
          <div className="flex flex-wrap gap-2">
            {MILESTONE_TIERS.map((tier) => {
              const isUnlocked = unlockedTiers.includes(tier.tier);
              return (
                <Badge
                  key={tier.tier}
                  variant={isUnlocked ? "default" : "outline"}
                  className={!isUnlocked ? "opacity-40" : ""}
                  title={`${tier.label}: ${tier.reward} (${tier.count} referrals)`}
                >
                  {tier.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
