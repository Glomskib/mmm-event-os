"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HealthResult {
  ok: boolean;
  accountCount?: number;
  error?: string;
}

export function LateHealthCheck() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);

  async function checkHealth() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/late-health");
      const data: HealthResult = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={checkHealth}
        disabled={loading}
      >
        {loading ? "Checking..." : "Check Connection"}
      </Button>

      {result && (
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              result.ok ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {result.ok
              ? `Connected — ${result.accountCount} account(s) linked`
              : `Failed: ${result.error}`}
          </span>
        </div>
      )}
    </div>
  );
}
