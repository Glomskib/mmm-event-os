import { redirect } from "next/navigation";
import { Hero } from "@/components/layout/hero";
import { getCurrentProfile } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Bike, CheckCircle2, Clock } from "lucide-react";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/profile");

  const supabase = await createClient();

  // Fetch raffle entries
  const { data: raffleEntries } = await supabase
    .from("raffle_entries")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const entries = raffleEntries ?? [];

  // Pool breakdown using tickets_count
  const referralTickets = entries
    .filter((e) => e.source === "referral")
    .reduce((sum, e) => sum + e.tickets_count, 0);
  const mainTickets = entries
    .filter((e) => e.source !== "referral")
    .reduce((sum, e) => sum + e.tickets_count, 0);
  const totalTickets = referralTickets + mainTickets;

  // Fetch check-in history
  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  // Fetch ride occurrence details for checkins
  const checkinRideIds = [...new Set((checkins ?? []).map((c) => c.ride_occurrence_id).filter(Boolean))] as string[];
  const { data: checkinRides } = checkinRideIds.length > 0
    ? await supabase.from("ride_occurrences").select("*, ride_series(title)").in("id", checkinRideIds)
    : { data: [] };
  const checkinRideMap = new Map((checkinRides ?? []).map((r) => [r.id, r]));

  return (
    <>
      <Hero
        title="My Profile"
        subtitle={profile.full_name || profile.email}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Profile Info */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {(profile.full_name?.[0] ?? profile.email[0]).toUpperCase()}
              </div>
              <div>
                {profile.full_name && (
                  <p className="text-xl font-semibold">{profile.full_name}</p>
                )}
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raffle Tickets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Raffle Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-6xl font-bold text-primary">{totalTickets}</p>
              <p className="mt-1 text-muted-foreground">
                total {totalTickets === 1 ? "ticket" : "tickets"} earned
              </p>
            </div>

            {totalTickets > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold">{referralTickets}</p>
                  <p className="mt-1 text-sm font-medium">Referral Raffle</p>
                  <p className="text-xs text-muted-foreground">From milestone rewards</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold">{mainTickets}</p>
                  <p className="mt-1 text-sm font-medium">Main Raffle</p>
                  <p className="text-xs text-muted-foreground">Shop rides, bonus & events</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5" />
              Check-in History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkins && checkins.length > 0 ? (
              <div className="space-y-3">
                {checkins.map((checkin) => {
                  const ride = checkin.ride_occurrence_id
                    ? checkinRideMap.get(checkin.ride_occurrence_id)
                    : null;
                  return (
                  <div
                    key={checkin.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {ride?.ride_series?.title ?? "Ride"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ride?.date
                          ? new Date(
                              ride.date + "T00:00:00"
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })
                          : "Unknown date"}
                      </p>
                    </div>
                    {checkin.approved ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground">
                No check-ins yet. Visit the{" "}
                <a href="/checkin" className="text-primary underline">
                  check-in page
                </a>{" "}
                after a ride!
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
