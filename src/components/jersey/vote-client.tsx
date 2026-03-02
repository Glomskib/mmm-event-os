"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DesignWithStats {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  voteCount: number;
  pct: number; // 0–100
}

interface VoteClientProps {
  designs: DesignWithStats[];
  userVoteDesignId: string | null;
  votingOpen: boolean;
  totalVotes: number;
  year: number;
  isAuthenticated: boolean;
  castVote: (designId: string) => Promise<{ ok: boolean; error?: string }>;
}

export function VoteClient({
  designs,
  userVoteDesignId: initialVoteId,
  votingOpen,
  totalVotes,
  year,
  isAuthenticated,
  castVote,
}: VoteClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [localVoteId, setLocalVoteId] = useState<string | null>(initialVoteId);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Sort by vote count desc for display
  const sorted = [...designs].sort((a, b) => b.voteCount - a.voteCount);
  const maxVotes = sorted[0]?.voteCount ?? 0;

  function handleVote(designId: string) {
    if (!votingOpen || !isAuthenticated) return;
    if (localVoteId === designId) return; // Already voted for this one

    setPendingId(designId);
    setVoteError(null);

    startTransition(async () => {
      const result = await castVote(designId);
      if (result.ok) {
        setLocalVoteId(designId);
        router.refresh();
      } else {
        setVoteError(result.error ?? "Failed to cast vote. Please try again.");
      }
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{totalVotes}</strong>{" "}
          {totalVotes === 1 ? "vote" : "votes"} cast
        </span>
        {!votingOpen && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            Voting closed — results below
          </span>
        )}
        {votingOpen && !isAuthenticated && (
          <a
            href={`/login?next=/hhh-jersey-vote`}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            Log in to vote
          </a>
        )}
      </div>

      {voteError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {voteError}
        </p>
      )}

      {/* Design grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((design) => {
          const isMyVote = localVoteId === design.id;
          const isWinner = !votingOpen && design.voteCount === maxVotes && maxVotes > 0;
          const isVotingThisOne = isPending && pendingId === design.id;

          return (
            <div
              key={design.id}
              className={`overflow-hidden rounded-xl border bg-card shadow-sm transition-all ${
                isMyVote
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:shadow-md"
              }`}
            >
              {/* Image */}
              <div className="relative aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={design.image_url}
                  alt={design.title}
                  className="h-full w-full object-cover"
                />

                {/* Winner badge */}
                {isWinner && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow"
                    style={{ backgroundColor: "var(--brand-orange)" }}
                  >
                    <Trophy className="h-3 w-3" />
                    Winner
                  </div>
                )}

                {/* Your vote badge */}
                {isMyVote && votingOpen && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow">
                    <CheckCircle className="h-3 w-3" />
                    Your Vote
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold leading-tight">{design.title}</h3>
                  {design.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {design.description}
                    </p>
                  )}
                </div>

                {/* Vote bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{design.voteCount} {design.voteCount === 1 ? "vote" : "votes"}</span>
                    <span>{totalVotes > 0 ? `${design.pct.toFixed(0)}%` : "—"}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${design.pct}%`,
                        backgroundColor: isMyVote ? "var(--primary)" : "var(--brand-orange)",
                      }}
                    />
                  </div>
                </div>

                {/* Vote button */}
                {votingOpen && (
                  <div>
                    {isAuthenticated ? (
                      <Button
                        size="sm"
                        className="w-full"
                        variant={isMyVote ? "default" : "outline"}
                        disabled={isVotingThisOne || isPending}
                        onClick={() => handleVote(design.id)}
                        style={
                          isMyVote
                            ? { backgroundColor: "var(--brand-orange)", color: "#fff", borderColor: "transparent" }
                            : {}
                        }
                      >
                        {isVotingThisOne
                          ? "Voting…"
                          : isMyVote
                          ? "✓ Your Vote"
                          : localVoteId
                          ? "Change Vote"
                          : "Vote"}
                      </Button>
                    ) : (
                      <a href={`/login?next=/hhh-jersey-vote`} className="block">
                        <Button size="sm" variant="outline" className="w-full">
                          Log in to vote
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {designs.length === 0 && (
        <div className="py-16 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Designs coming soon</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back before May 1 to cast your vote.
          </p>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {votingOpen
          ? `One vote per account. You may change your vote until May 1, ${year}.`
          : `Voting closed. Thank you to everyone who voted!`}
      </p>
    </div>
  );
}
