"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
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
  const remaining = nextTier ? nextTier.count - referralCount : 0;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareText = `Join me at Making Miles Matter! Every mile counts. Register with my link:`;

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`,
      "_blank"
    );
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      "_blank"
    );
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

        {/* Share buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={shareTwitter}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share on X
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={shareFacebook}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Facebook
          </Button>
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

        {/* Next milestone urgency */}
        {nextTier && (
          <div className="space-y-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center">
              <p className="text-sm font-medium">
                {remaining === 1
                  ? "1 more referral"
                  : `${remaining} more referrals`}{" "}
                to reach <span className="font-bold">{nextTier.label}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reward: {nextTier.reward}
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Progress
              </span>
              <span className="font-medium tabular-nums">
                {progress.current}/{progress.target}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(progress.pct, 100)}%` }}
              />
            </div>
          </div>
        )}

        {!nextTier && referralCount > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center">
            <p className="text-sm font-medium text-green-800">
              All milestones unlocked! You're a Legend.
            </p>
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
