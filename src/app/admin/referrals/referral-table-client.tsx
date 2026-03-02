"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { MILESTONE_TIERS } from "@/lib/referrals";

const PER_PAGE = 20;

interface ReferralEntry {
  user_id: string | null;
  rank: number | null;
  full_name: string | null;
  code: string | null;
  referral_count: number | null;
  tiers: string[];
}

export function ReferralTableClient({
  entries,
}: {
  entries: ReferralEntry[];
}) {
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, page: safePage } = usePagination(
    entries,
    PER_PAGE,
    page
  );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium">Rank</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-right font-medium">
                Paid Referrals
              </th>
              <th className="px-4 py-3 text-left font-medium">Tiers</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageItems.map((entry) => (
              <tr key={entry.user_id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{entry.rank}</td>
                <td className="px-4 py-3">{entry.full_name ?? "\u2014"}</td>
                <td className="px-4 py-3 font-mono text-xs">{entry.code}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.referral_count}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {entry.tiers.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        {"\u2014"}
                      </span>
                    )}
                    {entry.tiers.map((tier) => {
                      const milestone = MILESTONE_TIERS.find(
                        (t) => t.tier === tier
                      );
                      return (
                        <Badge
                          key={tier}
                          variant="secondary"
                          className="text-xs"
                        >
                          {milestone?.label ?? tier}
                        </Badge>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4">
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
