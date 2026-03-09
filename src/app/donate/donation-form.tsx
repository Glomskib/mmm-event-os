"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

const PRESET_AMOUNTS = [25, 50, 85, 150, 250, 500];

export function DonationForm() {
  const [selected, setSelected] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const donationAmount = isCustom
    ? parseFloat(customAmount) || 0
    : selected ?? 0;

  async function handleDonate() {
    if (donationAmount < 1) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(donationAmount * 100) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" style={{ color: "var(--brand-orange)" }} />
          Make a Donation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSelected(amount);
                setIsCustom(false);
              }}
              className={`rounded-lg border-2 px-3 py-3 text-center text-sm font-semibold transition-all ${
                !isCustom && selected === amount
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`mb-2 text-sm font-medium ${
              isCustom ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Custom amount
          </button>
          {isCustom && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-7"
                autoFocus
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          onClick={handleDonate}
          disabled={loading || donationAmount < 1}
          className="w-full gap-2"
          size="lg"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              Donate ${donationAmount.toFixed(0)}
              <Heart className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Making Miles Matter Inc. is a 501(c)(3) nonprofit.
          <br />
          All donations are tax-deductible and fund cycling community programs. EIN available upon request.
        </p>
      </CardContent>
    </Card>
  );
}
