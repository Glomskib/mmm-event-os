import { redirect } from "next/navigation";
import { Hero } from "@/components/layout/hero";
import { getCurrentProfile } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { CheckinForm } from "./checkin-form";

export const metadata = { title: "Check In | MMM Event OS" };

export default async function CheckinPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/checkin");

  const supabase = await createClient();

  // Fetch eligible ride occurrences: today + past 2 days, non-cancelled
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const { data: occurrences } = await supabase
    .from("ride_occurrences")
    .select("*, ride_series(title)")
    .eq("org_id", profile.org_id)
    .eq("cancelled", false)
    .gte("date", twoDaysAgo.toISOString().split("T")[0])
    .lte("date", today.toISOString().split("T")[0])
    .order("date", { ascending: false });

  // Fetch user's existing checkins to mark already-checked-in rides
  const occurrenceIds = (occurrences ?? []).map((o) => o.id);
  const { data: existingCheckins } = occurrenceIds.length > 0
    ? await supabase
        .from("checkins")
        .select("ride_occurrence_id")
        .eq("user_id", profile.id)
        .in("ride_occurrence_id", occurrenceIds)
    : { data: [] };

  const checkedInIds = new Set(
    (existingCheckins ?? []).map((c) => c.ride_occurrence_id)
  );

  const ridesWithStatus = (occurrences ?? []).map((occ) => ({
    id: occ.id,
    title: occ.ride_series?.title ?? "Ride",
    date: occ.date,
    note: occ.note,
    alreadyCheckedIn: checkedInIds.has(occ.id),
  }));

  async function submitCheckin(formData: FormData) {
    "use server";

    const rideOccurrenceId = formData.get("rideOccurrenceId") as string;
    const photoPath = formData.get("photoPath") as string;

    if (!rideOccurrenceId || !photoPath) {
      throw new Error("Missing required fields");
    }

    const currentProfile = await getCurrentProfile();
    if (!currentProfile) throw new Error("Not authenticated");

    const supa = await createClient();

    const { error } = await supa.from("checkins").insert({
      org_id: currentProfile.org_id,
      user_id: currentProfile.id,
      ride_occurrence_id: rideOccurrenceId,
      photo_path: photoPath,
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("You already checked in to this ride");
      }
      throw new Error(error.message);
    }

    redirect("/checkin?success=true");
  }

  return (
    <>
      <Hero
        title="Ride Check-In"
        subtitle="Upload a photo from your ride to earn a raffle ticket!"
      />

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <CheckinForm rides={ridesWithStatus} submitAction={submitCheckin} />
      </section>
    </>
  );
}
