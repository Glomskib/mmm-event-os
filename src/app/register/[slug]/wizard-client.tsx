"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { waiverText, waiverVersion } from "@/content/waiver/mmm_waiver_2026_v1";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Calendar, Check, MapPin } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventInfo {
  id: string;
  title: string;
  slug: string;
  date: string;
  location: string | null;
  description: string | null;
}

interface DistanceOption {
  distance: string;
  price: number;
}

export interface RegistrationWizardProps {
  event: EventInfo;
  distances: DistanceOption[];
  isAuthed: boolean;
  userEmail: string | null;
  userFullName: string | null;
  initialDistance: string;
  initialRef: string;
}

const isDev = process.env.NODE_ENV === "development";

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function FieldError({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function GoogleIcon() {
  return (
    <svg
      className="mr-2 h-4 w-4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressSteps({
  currentStep,
  isAuthed,
}: {
  currentStep: 1 | 2 | 3;
  isAuthed: boolean;
}) {
  const steps = [
    { num: 1, label: "Distance" },
    {
      num: 2,
      label:
        isAuthed && currentStep === 3 ? "Signed In" : "Account",
    },
    { num: 3, label: "Waiver" },
  ];

  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const isDone =
          currentStep > step.num ||
          (step.num === 2 && isAuthed && currentStep === 3);
        const isActive = currentStep === step.num;

        return (
          <div key={step.num} className="flex flex-1 items-start">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isDone
                    ? "bg-primary/15 text-primary"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : step.num}
              </span>
              <span
                className={`text-center text-[11px] leading-tight ${
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-2 mt-3.5 h-px flex-1 transition-colors ${
                  currentStep > step.num ? "bg-primary/40" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Distance Selection ─────────────────────────────────────────────────

function DistanceStep({
  distances,
  slug,
  initialRef,
  router,
}: {
  distances: DistanceOption[];
  slug: string;
  initialRef: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [selected, setSelected] = useState<string>(
    distances.length === 1 ? distances[0].distance : ""
  );

  function buildNext(dist: string) {
    const ref = initialRef ? `&ref=${encodeURIComponent(initialRef)}` : "";
    return `/register/${slug}?distance=${encodeURIComponent(dist)}${ref}`;
  }

  function handleContinue() {
    if (!selected) return;
    router.push(buildNext(selected));
  }

  if (distances.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center text-sm text-muted-foreground">
        <p>Distance options are not configured for this event yet.</p>
        <Button variant="outline" onClick={() => router.push("/events")}>
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Choose Your Distance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the distance you want to ride.
        </p>
      </div>

      <div className="space-y-3">
        {distances.map((d) => (
          <button
            key={d.distance}
            type="button"
            onClick={() => setSelected(d.distance)}
            className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-all ${
              selected === d.distance
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{d.distance}</span>
              <span
                className={`text-sm font-semibold ${
                  d.price === 0 ? "text-green-600" : "text-foreground"
                }`}
              >
                {d.price === 0 ? "Free" : `$${(d.price / 100).toFixed(2)}`}
              </span>
            </div>
            {selected === d.distance && (
              <span className="mt-1 flex items-center gap-1 text-xs text-primary">
                <Check className="h-3 w-3" /> Selected
              </span>
            )}
          </button>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selected}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}

// ── Step 2: Auth ──────────────────────────────────────────────────────────────

function AuthStep({
  slug,
  selectedDistance,
  initialRef,
  router,
}: {
  slug: string;
  selectedDistance: string;
  initialRef: string;
  router: ReturnType<typeof useRouter>;
}) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const refParam = initialRef ? `&ref=${encodeURIComponent(initialRef)}` : "";
  const next = `/register/${slug}?distance=${encodeURIComponent(selectedDistance)}${refParam}&step=waiver`;

  async function handleGoogle() {
    setLoading(true);
    setMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setMessage({ text: error.message, isError: true });
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage({ text: error.message, isError: true });
      setLoading(false);
    } else {
      window.location.href = next;
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setMessage({ text: error.message, isError: true });
      setLoading(false);
    } else if (data.session) {
      window.location.href = next;
    } else {
      setMessage({
        text: "Check your email to confirm your account, then sign in below.",
        isError: false,
      });
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Sign in to continue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You need an account to sign the waiver and manage your registration.
        </p>
      </div>

      {/* Distance reminder */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Registering for: </span>
        <span className="font-medium">{selectedDistance}</span>
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={handleGoogle}
        disabled={loading}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email / password */}
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1.5">
          <label htmlFor="wiz-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="wiz-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="wiz-password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="wiz-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min 6 characters"
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleSignIn}
            disabled={loading || !email || !password}
          >
            Sign In
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleSignUp}
            disabled={loading || !email || !password}
          >
            Create Account
          </Button>
        </div>
      </form>

      {message && (
        <p
          className={`text-center text-sm ${
            message.isError ? "text-red-600" : "text-muted-foreground"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={() => router.push(`/register/${slug}`)}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        ← Change distance
      </button>
    </div>
  );
}

// ── Step 3: Waiver ────────────────────────────────────────────────────────────

function WaiverStep({
  event,
  selectedDistance,
  initialRef,
  userEmail,
  userFullName,
  router,
}: {
  event: EventInfo;
  selectedDistance: string;
  initialRef: string;
  userEmail: string | null;
  userFullName: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [devBypassScroll, setDevBypassScroll] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fields — pre-filled from server props (no extra /api/profile fetch needed)
  const [participantName, setParticipantName] = useState(userFullName ?? "");
  const [participantEmail, setParticipantEmail] = useState(userEmail ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Additional rider info
  const [shirtSize, setShirtSize] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  // Referral code — prop takes priority, fallback to cookie
  const [referralCode, setReferralCode] = useState(initialRef);
  useEffect(() => {
    if (referralCode) return;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("ref_code="));
    if (match) setReferralCode(match.split("=")[1]);
  }, [referralCode]);

  // Scroll gate
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      setHasScrolledToBottom(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 50) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const scrollGatePassed = hasScrolledToBottom || devBypassScroll;

  // Validation
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

  const canSubmit = scrollGatePassed && isChecked && fieldsComplete && !isSubmitting;

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
          event_id: event.id,
          distance: selectedDistance,
          referralCode: referralCode || undefined,
          participant_name: participantName.trim(),
          participant_email: participantEmail.trim(),
          emergency_contact_name: emergencyContactName.trim(),
          emergency_contact_phone: emergencyContactPhone.trim(),
          shirt_size: shirtSize || undefined,
          medical_info: medicalInfo.trim() || undefined,
          dietary_restrictions: dietaryRestrictions.trim() || undefined,
          skill_level: skillLevel || undefined,
        }),
      });

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        /* not JSON */
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Session expired. Please refresh the page and try again.");
        } else if (res.status >= 500) {
          const ref = data.requestId ? ` (ref: ${String(data.requestId)})` : "";
          setError(`Server error${ref}. Please try again or contact support.`);
        } else {
          setError(
            typeof data.error === "string"
              ? data.error
              : `Registration failed (${res.status}). Please try again.`
          );
        }
        setIsSubmitting(false);
        return;
      }

      // Free registration → success page
      if (data.is_free) {
        router.push(`/success?free=true&registration_id=${data.registration_id}`);
        return;
      }

      // Paid → Stripe checkout
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: data.registration_id }),
      });

      let checkoutData: Record<string, unknown> = {};
      try {
        checkoutData = await checkoutRes.json();
      } catch {
        /* not JSON */
      }

      if (!checkoutRes.ok) {
        setError(
          typeof checkoutData.error === "string"
            ? checkoutData.error
            : `Checkout failed (${checkoutRes.status}). Your registration was saved — please try again or contact us.`
        );
        setIsSubmitting(false);
        return;
      }

      window.location.href = checkoutData.url as string;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Participation Waiver</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Version: {waiverVersion}
        </p>
      </div>

      {/* Distance + change */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span>
          <span className="text-muted-foreground">Distance: </span>
          <span className="font-medium">{selectedDistance}</span>
        </span>
        <button
          type="button"
          onClick={() => router.push(`/register/${event.slug}`)}
          className="text-xs text-primary hover:underline"
        >
          Change
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Participant information */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Participant Information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="wiz-p-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Full Name *
            </label>
            <Input
              id="wiz-p-name"
              type="text"
              required
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              onBlur={() => markTouched("participantName")}
              placeholder="Jane Doe"
              aria-invalid={!!fieldErrors.participantName}
            />
            <FieldError
              show={!!fieldErrors.participantName}
              message={fieldErrors.participantName ?? ""}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="wiz-p-email"
              className="text-xs font-medium text-muted-foreground"
            >
              Email *
            </label>
            <Input
              id="wiz-p-email"
              type="email"
              required
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              onBlur={() => markTouched("participantEmail")}
              placeholder="jane@example.com"
              aria-invalid={!!fieldErrors.participantEmail}
            />
            <FieldError
              show={!!fieldErrors.participantEmail}
              message={fieldErrors.participantEmail ?? ""}
            />
          </div>
        </div>
      </div>

      {/* Emergency contact */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Emergency Contact</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="wiz-ec-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Contact Name *
            </label>
            <Input
              id="wiz-ec-name"
              type="text"
              required
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              onBlur={() => markTouched("emergencyContactName")}
              placeholder="John Doe"
              aria-invalid={!!fieldErrors.emergencyContactName}
            />
            <FieldError
              show={!!fieldErrors.emergencyContactName}
              message={fieldErrors.emergencyContactName ?? ""}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="wiz-ec-phone"
              className="text-xs font-medium text-muted-foreground"
            >
              Contact Phone *
            </label>
            <Input
              id="wiz-ec-phone"
              type="tel"
              required
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              onBlur={() => markTouched("emergencyContactPhone")}
              placeholder="(555) 123-4567"
              aria-invalid={!!fieldErrors.emergencyContactPhone}
            />
            <FieldError
              show={!!fieldErrors.emergencyContactPhone}
              message={fieldErrors.emergencyContactPhone ?? ""}
            />
          </div>
        </div>
      </div>

      {/* Rider details */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Rider Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="wiz-shirt"
              className="text-xs font-medium text-muted-foreground"
            >
              T-Shirt Size
            </label>
            <select
              id="wiz-shirt"
              value={shirtSize}
              onChange={(e) => setShirtSize(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select size...</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="2XL">2XL</option>
              <option value="3XL">3XL</option>
            </select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="wiz-skill"
              className="text-xs font-medium text-muted-foreground"
            >
              Riding Experience
            </label>
            <select
              id="wiz-skill"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select level...</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite / Competitive</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label
              htmlFor="wiz-dietary"
              className="text-xs font-medium text-muted-foreground"
            >
              Dietary Restrictions / Allergies
            </label>
            <Input
              id="wiz-dietary"
              type="text"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              placeholder="e.g., gluten-free, nut allergy (optional)"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label
              htmlFor="wiz-medical"
              className="text-xs font-medium text-muted-foreground"
            >
              Medical Conditions / Notes
            </label>
            <Input
              id="wiz-medical"
              type="text"
              value={medicalInfo}
              onChange={(e) => setMedicalInfo(e.target.value)}
              placeholder="e.g., asthma, insulin-dependent (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Shared only with event medical staff and SAG support.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable waiver */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Please read the waiver in its entirety before agreeing.
        </p>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[380px] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
          style={{ overscrollBehavior: "contain" }}
        >
          {waiverText}
        </div>
      </div>

      {!scrollGatePassed && (
        <p className="text-xs text-amber-600">
          Scroll to the bottom of the waiver to enable the agreement checkbox.
        </p>
      )}

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

      <label
        className={`flex items-start gap-3 ${
          !scrollGatePassed ? "pointer-events-none opacity-50" : ""
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
          I have read and agree to the Assumption of Risk, Waiver of Liability,
          and Indemnification Agreement.
        </span>
      </label>

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
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function RegistrationWizard({
  event,
  distances,
  isAuthed,
  userEmail,
  userFullName,
  initialDistance,
  initialRef,
}: RegistrationWizardProps) {
  const router = useRouter();

  // Step is fully derived from server-provided props (stable per page-load):
  //   1 — no distance selected yet
  //   2 — distance selected but not signed in
  //   3 — distance selected and signed in
  const currentStep = (!initialDistance ? 1 : !isAuthed ? 2 : 3) as 1 | 2 | 3;

  return (
    <section className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      {/* Event header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(event.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <ProgressSteps currentStep={currentStep} isAuthed={isAuthed} />
        </CardHeader>
        <CardContent className="pt-4">
          {currentStep === 1 && (
            <DistanceStep
              distances={distances}
              slug={event.slug}
              initialRef={initialRef}
              router={router}
            />
          )}
          {currentStep === 2 && (
            <AuthStep
              slug={event.slug}
              selectedDistance={initialDistance}
              initialRef={initialRef}
              router={router}
            />
          )}
          {currentStep === 3 && (
            <WaiverStep
              event={event}
              selectedDistance={initialDistance}
              initialRef={initialRef}
              userEmail={userEmail}
              userFullName={userFullName}
              router={router}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
