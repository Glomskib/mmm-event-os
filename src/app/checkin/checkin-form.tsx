"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2, Loader2, MapPin, Share2 } from "lucide-react";

interface Ride {
  id: string;
  title: string;
  date: string;
  note: string | null;
  alreadyCheckedIn: boolean;
}

export function CheckinForm({
  rides,
  submitAction,
}: {
  rides: Ride[];
  submitAction: (formData: FormData) => Promise<void>;
}) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const checkinId = searchParams.get("checkinId");
  const rideName = searchParams.get("rideName");
  const successPhotoPath = searchParams.get("photoPath");

  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareBonusClaimed, setShareBonusClaimed] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedRide) return;

    setError(null);
    setUploading(true);

    try {
      // Get signed upload URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          rideOccurrenceId: selectedRide,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { signedUrl, path, token } = await res.json();

      // Upload file to storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload photo");

      setPhotoPath(path);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedRide || !photoPath) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("rideOccurrenceId", selectedRide);
      formData.set("photoPath", photoPath);
      formData.set("locationConfirmed", locationConfirmed ? "true" : "false");
      await submitAction(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
      setSubmitting(false);
    }
  }

  async function handleFacebookShare() {
    if (!checkinId) return;

    // Open Facebook share dialog
    const shareText = `I'm riding the ${rideName ?? "Ride"} ride with Making Miles Matter! \u{1F6B4}`;
    const shareUrl = window.location.origin;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, "fb-share", "width=600,height=400");

    // Award bonus raffle ticket
    setClaimingBonus(true);
    try {
      const res = await fetch("/api/checkin/fb-share-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkinId }),
      });
      const data = await res.json();
      if (res.ok) {
        setShareBonusClaimed(true);
      }
    } catch {
      // Silently handle — the share still happened
    } finally {
      setClaimingBonus(false);
    }
  }

  if (success) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold">Checked In!</h2>
          <p className="mt-2 text-muted-foreground">
            Your photo is pending admin review. Once approved, you&apos;ll earn a raffle ticket!
          </p>

          {/* Facebook Share Bonus */}
          {checkinId && !shareBonusClaimed && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="mb-3 text-sm font-medium text-blue-800 dark:text-blue-200">
                Share on Facebook to earn 1 bonus raffle ticket!
              </p>
              <Button
                onClick={handleFacebookShare}
                disabled={claimingBonus}
                className="bg-[#1877F2] text-white hover:bg-[#166FE5]"
              >
                {claimingBonus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming bonus...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share on Facebook
                  </>
                )}
              </Button>
            </div>
          )}

          {shareBonusClaimed && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                <CheckCircle2 className="mr-1 inline h-4 w-4" />
                Bonus raffle ticket earned! Thanks for sharing!
              </p>
            </div>
          )}

          <Button className="mt-6" onClick={() => window.location.href = "/checkin"}>
            Check In to Another Ride
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (rides.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No eligible rides</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back on a ride day to check in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Ride */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">1. Select your ride</h2>
        <div className="space-y-2">
          {rides.map((ride) => (
            <Card
              key={ride.id}
              className={`cursor-pointer transition-shadow ${
                ride.alreadyCheckedIn
                  ? "opacity-50 cursor-not-allowed"
                  : selectedRide === ride.id
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:shadow-md"
              }`}
              onClick={() => {
                if (!ride.alreadyCheckedIn) {
                  setSelectedRide(ride.id);
                  setPhotoPath(null);
                  setPreviewUrl(null);
                  setError(null);
                }
              }}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{ride.title}</CardTitle>
                  {ride.alreadyCheckedIn && (
                    <Badge variant="secondary">Already Checked In</Badge>
                  )}
                </div>
                <CardDescription>
                  {new Date(ride.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                  {ride.note && ` — ${ride.note}`}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Step 2: Upload Photo */}
      {selectedRide && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">2. Upload a ride photo <span className="text-destructive">*</span></h2>
          <p className="mb-3 text-sm text-muted-foreground">
            A photo of you at the ride is required to complete check-in.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Ride photo preview"
                className="w-full rounded-lg object-cover max-h-64"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                Change Photo
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-32 border-dashed"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Take or Choose Photo
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Step 3: Confirm Location */}
      {photoPath && (
        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              checked={locationConfirmed}
              onChange={(e) => setLocationConfirmed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded"
            />
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-emerald-600" />
                I confirm I was at the ride location
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Optional — helps verify your check-in
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Step 4: Submit */}
      {photoPath && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Check-In"
          )}
        </Button>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
