"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { Download } from "lucide-react";

const PER_PAGE = 10;

interface BreakdownItem {
  label: string;
  cents: number;
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}

function exportBreakdownCsv(
  items: BreakdownItem[],
  header: [string, string],
  filename: string
) {
  const rows = items.map((i) => [i.label, fmt(i.cents)]);
  const csv = [header, ...rows]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RevenueBreakdownCard({
  title,
  items,
  csvFilename,
}: {
  title: string;
  items: BreakdownItem[];
  csvFilename: string;
}) {
  const [page, setPage] = useState(1);
  const sorted = [...items].sort((a, b) => b.cents - a.cents);
  const { pageItems, totalPages, page: safePage } = usePagination(
    sorted,
    PER_PAGE,
    page
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportBreakdownCsv(
                sorted,
                [title.replace("Revenue by ", ""), "Revenue"],
                csvFilename
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revenue yet.</p>
        ) : (
          <>
            <div className="space-y-3">
              {pageItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{item.label}</span>
                  <Badge variant="secondary">{fmt(item.cents)}</Badge>
                </div>
              ))}
            </div>
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
