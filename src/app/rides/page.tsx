import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bike, Clock, MapPin } from "lucide-react";

export const metadata = { title: "Rides | MMM Event OS" };

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const difficultyColors: Record<string, "default" | "secondary" | "destructive"> = {
  easy: "secondary",
  moderate: "default",
  hard: "destructive",
};

export default async function RidesPage() {
  const supabase = await createClient();

  const { data: series } = await supabase
    .from("ride_series")
    .select("*")
    .order("day_of_week", { ascending: true });

  const { data: occurrences } = await supabase
    .from("ride_occurrences")
    .select("*, ride_series(*)")
    .gte("date", new Date().toISOString().split("T")[0])
    .eq("cancelled", false)
    .order("date", { ascending: true })
    .limit(10);

  return (
    <>
      <Hero
        title="Group Rides"
        subtitle="Weekly ride series and upcoming scheduled rides."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold">Ride Series</h2>

        {series && series.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((ride) => (
              <Card key={ride.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ride.title}</CardTitle>
                    <Badge variant={difficultyColors[ride.difficulty]}>
                      {ride.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{ride.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Bike className="h-4 w-4" />
                    <span>Every {dayNames[ride.day_of_week]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{ride.time}</span>
                  </div>
                  {ride.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{ride.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Bike className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No ride series yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon for scheduled rides.
            </p>
          </div>
        )}

        <h2 className="mb-6 mt-16 text-2xl font-bold">Upcoming Rides</h2>

        {occurrences && occurrences.length > 0 ? (
          <div className="space-y-3">
            {occurrences.map((occ) => (
              <Card key={occ.id} className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bike className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {occ.ride_series?.title ?? "Ride"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(occ.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                    {occ.note && ` — ${occ.note}`}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            No upcoming rides scheduled.
          </p>
        )}
      </section>
    </>
  );
}
