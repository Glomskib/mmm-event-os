"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportRaffleClient({
  action,
}: {
  action: () => Promise<string>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const csv = await action();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `raffle-entries-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Exporting..." : "Export Raffle CSV"}
    </Button>
  );
}
