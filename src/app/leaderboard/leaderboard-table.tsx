"use client";

import { Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LeaderboardEntry = {
  user_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  referral_count: number | null;
  rank: number | null;
  code: string | null;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
      {rank}
    </span>
  );
}

export function LeaderboardTable({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            No referrals yet. Share your link to be the first on the board!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Referrers</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="divide-y">
          {entries.map((entry) => {
            const isCurrentUser = entry.user_id === currentUserId;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-6 py-3 ${
                  isCurrentUser ? "bg-primary/5" : ""
                }`}
              >
                <RankBadge rank={entry.rank ?? 0} />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">
                    {entry.full_name ?? "Anonymous"}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {entry.referral_count ?? 0}{" "}
                  <span className="font-normal text-muted-foreground">
                    {entry.referral_count === 1 ? "referral" : "referrals"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
