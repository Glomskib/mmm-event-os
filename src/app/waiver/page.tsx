"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { waiverText, waiverVersion } from "@/content/waiver/mmm_waiver_2026_v1";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DistanceOption = { distance: string; price: number };

export default function WaiverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventId = searchParams.get("event_id") ?? "";
  const distanceParam = searchParams.get("distance") ?? "";
  const referralCode = searchParams.get("ref") ?? "";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event info + distance selection
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [distances, setDistances] = useState<DistanceOption[]>([]);
  const [selectedDistance, setSelectedDistance] = useState(distanceParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    fetch(`/api/events/${eventId}/distances`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEventTitle(data.title);
          setDistances(data.distances ?? []);
          // If distance param was provided or only one option, auto-select
          if (distanceParam) {
            setSelectedDistance(distanceParam);
          } else if (data.distances?.length === 1) {
            setSelectedDistance(data.distances[0].distance);
          }
        }
      })
      .catch(() => setError("Failed to load event info."))
      .finally(() => setLoading(false));
  }, [eventId, distanceParam]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollBottom = el.scrollTop + el.clientHeight;
    const threshold = el.scrollHeight - 50;
    if (scrollBottom >= threshold) {
      setHasScrolledToBottom(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) return;
    // Handle case where content fits without scrolling
    if (el.scrollHeight <= el.clientHeight + 50) {
      setHasScrolledToBottom(true);
    }
  }, [loading]);

  const canSubmit =
    hasScrolledToBottom &&
    isChecked &&
    !isSubmitting &&
    !!selectedDistance &&
    !!eventId;

  async function handleAccept() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/waiver/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          distance: selectedDistance,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setIsSubmitting(false);
        return;
      }

      if (data.is_free) {
        router.push(
          `/success?free=true&registration_id=${data.registration_id}`
        );
        return;
      }

      // Paid — call checkout with the registration_id
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: data.registration_id }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setError(checkoutData.error || "Checkout failed.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = checkoutData.url;
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (!eventId) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Missing event. Please select an event first.
            </p>
            <Button className="mt-4" onClick={() => router.push("/events")}>
              Browse Events
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading…</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Participation Waiver</CardTitle>
          {eventTitle && (
            <p className="text-sm font-medium">{eventTitle}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Please read the waiver below in its entirety. You must scroll to
            the bottom before you can proceed.
          </p>
          <p className="text-xs text-muted-foreground">
            Waiver version: {waiverVersion}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distance selector (if multiple distances and none pre-selected) */}
          {distances.length > 1 && !distanceParam && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select distance</label>
              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a distance…</option>
                {distances.map((d) => (
                  <option key={d.distance} value={d.distance}>
                    {d.distance}
                    {d.price === 0
                      ? " — Free"
                      : ` — $${(d.price / 100).toFixed(2)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected distance display (if pre-selected) */}
          {selectedDistance && distanceParam && (
            <div className="rounded-lg border p-3 text-sm">
              <span className="text-muted-foreground">Distance: </span>
              <span className="font-medium">{selectedDistance}</span>
            </div>
          )}

          {/* Scrollable waiver text */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-80 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {waiverText}
          </div>

          {!hasScrolledToBottom && (
            <p className="text-xs text-amber-600">
              Scroll to the bottom of the waiver to continue.
            </p>
          )}

          {/* Checkbox */}
          <label
            className={`flex items-start gap-3 ${
              !hasScrolledToBottom ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">
              I have read and agree to the Assumption of Risk, Waiver of
              Liability, and Indemnification Agreement.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleAccept}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Processing…" : "I Agree — Continue"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
