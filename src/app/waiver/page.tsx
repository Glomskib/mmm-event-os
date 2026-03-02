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

const isDev = process.env.NODE_ENV === "development";

function FieldError({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function WaiverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventId = searchParams.get("event_id") ?? "";
  const distanceParam = searchParams.get("distance") ?? "";
  const [referralCode, setReferralCode] = useState(
    searchParams.get("ref") ?? ""
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Dev-only scroll gate bypass
  const [devBypassScroll, setDevBypassScroll] = useState(false);

  // Event info + distance selection
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [distances, setDistances] = useState<DistanceOption[]>([]);
  const [selectedDistance, setSelectedDistance] = useState(distanceParam);
  const [loading, setLoading] = useState(true);

  // Participant + emergency contact fields
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Auto-fill from profile (gracefully handles 401 / missing data)
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.full_name) setParticipantName(data.full_name);
        if (data.email) setParticipantEmail(data.email);
      })
      .catch(() => {
        // Not logged in or profile fetch failed — fields stay empty for manual entry
      });
  }, []);

  // Cookie fallback for referral code
  useEffect(() => {
    if (referralCode) return;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("ref_code="));
    if (match) {
      setReferralCode(match.split("=")[1]);
    }
  }, [referralCode]);

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

  const scrollGatePassed = hasScrolledToBottom || devBypassScroll;

  // Inline validation
  const validEmail =
    participantEmail.trim() === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participantEmail.trim());
  const validPhone =
    emergencyContactPhone.trim() === "" ||
    emergencyContactPhone.trim().replace(/\D/g, "").length >= 7;

  const fieldErrors = {
    participantName:
      touched.participantName && !participantName.trim()
        ? "Full name is required."
        : null,
    participantEmail:
      touched.participantEmail && !participantEmail.trim()
        ? "Email is required."
        : touched.participantEmail && !validEmail
          ? "Enter a valid email address."
          : null,
    emergencyContactName:
      touched.emergencyContactName && !emergencyContactName.trim()
        ? "Emergency contact name is required."
        : null,
    emergencyContactPhone:
      touched.emergencyContactPhone && !emergencyContactPhone.trim()
        ? "Emergency contact phone is required."
        : touched.emergencyContactPhone && !validPhone
          ? "Enter a valid phone number."
          : null,
  };

  const fieldsComplete =
    participantName.trim() !== "" &&
    participantEmail.trim() !== "" &&
    validEmail &&
    emergencyContactName.trim() !== "" &&
    emergencyContactPhone.trim() !== "" &&
    validPhone;

  const canSubmit =
    scrollGatePassed &&
    isChecked &&
    fieldsComplete &&
    !isSubmitting &&
    !!selectedDistance &&
    !!eventId;

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function touchAll() {
    setTouched({
      participantName: true,
      participantEmail: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
    });
  }

  async function handleAccept() {
    touchAll();
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
          participant_name: participantName.trim(),
          participant_email: participantEmail.trim(),
          emergency_contact_name: emergencyContactName.trim(),
          emergency_contact_phone: emergencyContactPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (isDev) console.error("Waiver accept error:", res.status, data);
        setError(
          data.error ||
            `Registration failed (${res.status}). Please try again.`
        );
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
        if (isDev)
          console.error(
            "Stripe checkout error:",
            checkoutRes.status,
            checkoutData
          );
        setError(
          checkoutData.error ||
            `Checkout failed (${checkoutRes.status}). Your registration was saved — please try again or contact us.`
        );
        setIsSubmitting(false);
        return;
      }

      window.location.href = checkoutData.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
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
          {/* Error banner */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

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

          {/* Participant info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Participant Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="participant-name" className="text-xs text-muted-foreground">
                  Full Name *
                </label>
                <input
                  id="participant-name"
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  onBlur={() => markTouched("participantName")}
                  placeholder="Jane Doe"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${fieldErrors.participantName ? "border-red-400" : ""}`}
                />
                <FieldError
                  show={!!fieldErrors.participantName}
                  message={fieldErrors.participantName ?? ""}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="participant-email" className="text-xs text-muted-foreground">
                  Email *
                </label>
                <input
                  id="participant-email"
                  type="email"
                  required
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  onBlur={() => markTouched("participantEmail")}
                  placeholder="jane@example.com"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${fieldErrors.participantEmail ? "border-red-400" : ""}`}
                />
                <FieldError
                  show={!!fieldErrors.participantEmail}
                  message={fieldErrors.participantEmail ?? ""}
                />
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Emergency Contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="emergency-name" className="text-xs text-muted-foreground">
                  Contact Name *
                </label>
                <input
                  id="emergency-name"
                  type="text"
                  required
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  onBlur={() => markTouched("emergencyContactName")}
                  placeholder="John Doe"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${fieldErrors.emergencyContactName ? "border-red-400" : ""}`}
                />
                <FieldError
                  show={!!fieldErrors.emergencyContactName}
                  message={fieldErrors.emergencyContactName ?? ""}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="emergency-phone" className="text-xs text-muted-foreground">
                  Contact Phone *
                </label>
                <input
                  id="emergency-phone"
                  type="tel"
                  required
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  onBlur={() => markTouched("emergencyContactPhone")}
                  placeholder="(555) 123-4567"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${fieldErrors.emergencyContactPhone ? "border-red-400" : ""}`}
                />
                <FieldError
                  show={!!fieldErrors.emergencyContactPhone}
                  message={fieldErrors.emergencyContactPhone ?? ""}
                />
              </div>
            </div>
          </div>

          {/* Scrollable waiver text */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[420px] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
            style={{ overscrollBehavior: "contain" }}
          >
            {waiverText}
          </div>

          {!scrollGatePassed && (
            <p className="text-xs text-amber-600">
              Scroll to the bottom of the waiver to enable the agreement
              checkbox.
            </p>
          )}

          {/* Dev-only scroll bypass */}
          {isDev && !hasScrolledToBottom && (
            <label className="flex items-center gap-2 rounded border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <input
                type="checkbox"
                checked={devBypassScroll}
                onChange={(e) => setDevBypassScroll(e.target.checked)}
              />
              [DEV] Bypass Scroll Gate
            </label>
          )}

          {/* Checkbox */}
          <label
            className={`flex items-start gap-3 ${
              !scrollGatePassed ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              disabled={!scrollGatePassed}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">
              I have read and agree to the Assumption of Risk, Waiver of
              Liability, and Indemnification Agreement.
            </span>
          </label>

          {/* Signature timestamp preview */}
          {isChecked && fieldsComplete && (
            <p className="text-xs text-muted-foreground">
              Signature recorded at: {new Date().toLocaleString()}
            </p>
          )}

          <Button
            onClick={handleAccept}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing…
              </span>
            ) : (
              "I Agree — Continue"
            )}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
