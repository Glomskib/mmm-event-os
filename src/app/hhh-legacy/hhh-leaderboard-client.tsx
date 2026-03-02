"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search } from "lucide-react";

interface LeaderboardRow {
  user_id: string | null;
  display_name: string | null;
  email: string | null;
  manual_miles: number | null;
  imported_miles: number | null;
  auto_miles: number | null;
  total_hhh_miles: number | null;
  hhh_reg_count: number | null;
  last_hhh_year: number | null;
}

interface Props {
  rows: LeaderboardRow[];
}

export function HhhLeaderboardClient({ rows }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? rows.filter((r) =>
        (r.display_name ?? "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : rows;

  return (
    <div className="space-y-5">
      {/* Actions row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link
          href="/profile/hhh-legacy"
          className="text-sm text-primary hover:underline"
        >
          Add your legacy miles →
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top {filtered.length} Riders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              {search ? "No riders match your search." : "No entries yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pl-6 pr-4 pt-4 font-medium">#</th>
                    <th className="px-4 pb-3 pt-4 font-medium">Rider</th>
                    <th className="px-4 pb-3 pt-4 text-right font-medium">
                      Total Miles
                    </th>
                    <th className="hidden px-4 pb-3 pt-4 text-right font-medium sm:table-cell">
                      Legacy
                    </th>
                    <th className="hidden px-4 pb-3 pt-4 text-right font-medium sm:table-cell">
                      Shopify
                    </th>
                    <th className="hidden px-4 pb-3 pt-4 text-right font-medium sm:table-cell">
                      Auto
                    </th>
                    <th className="hidden px-4 pb-3 pr-6 pt-4 text-right font-medium sm:table-cell">
                      Rides
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => {
                    const rank = rows.indexOf(row) + 1;
                    const total = row.total_hhh_miles ?? 0;
                    const isTop3 = rank <= 3;
                    return (
                      <tr
                        key={row.user_id ?? idx}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="py-3 pl-6 pr-4">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              rank === 1
                                ? "bg-yellow-400/20 text-yellow-700"
                                : rank === 2
                                  ? "bg-slate-200 text-slate-700"
                                  : rank === 3
                                    ? "bg-amber-100 text-amber-800"
                                    : "text-muted-foreground"
                            }`}
                          >
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {row.display_name ?? "Rider"}
                          {row.last_hhh_year && (
                            <span className="ml-2 text-[11px] text-muted-foreground">
                              last: {row.last_hhh_year}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-semibold ${
                              isTop3 ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {total.toLocaleString()}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            mi
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                          {(row.manual_miles ?? 0).toLocaleString()}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                          {(row.imported_miles ?? 0).toLocaleString()}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                          {(row.auto_miles ?? 0).toLocaleString()}
                        </td>
                        <td className="hidden px-4 py-3 pr-6 text-right text-muted-foreground sm:table-cell">
                          {row.hhh_reg_count ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Legacy miles are self-reported for 1974–2024. Miles from 2025+ are
        auto-calculated from registrations.{" "}
        <Link href="/profile/hhh-legacy" className="text-primary hover:underline">
          Add yours
        </Link>
        .
      </p>
    </div>
  );
}
