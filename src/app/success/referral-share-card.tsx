"use client";

import { useState } from "react";
import { Copy, Check, Share2, Gift } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReferralShareCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/events?ref=${code}`
      : `?ref=${code}`;

  const shareText =
    "I just registered for Making Miles Matter! Join me — every mile counts.";

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
    <Card className="mt-6">
      <CardHeader className="text-center">
        <Gift className="mx-auto mb-2 h-8 w-8 text-primary" />
        <CardTitle className="text-lg">
          Invite Friends, Earn Rewards
        </CardTitle>
        <CardDescription>
          Share your referral link and earn raffle tickets + milestone rewards
          for every friend who registers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code display */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Your referral code</p>
          <p className="mt-1 text-xl font-bold tracking-wider">{code}</p>
        </div>

        {/* Copy link */}
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
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCopy}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
