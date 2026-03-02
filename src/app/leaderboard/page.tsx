import { Hero } from "@/components/layout/hero";
import { Trophy } from "lucide-react";

export const metadata = { title: "Leaderboard | MMM Event OS" };

export default function LeaderboardPage() {
  return (
    <>
      <Hero
        title="Leaderboard"
        subtitle="See who's putting in the most miles this month."
      />

      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Trophy className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-6 text-xl font-semibold">Coming Soon</h2>
        <p className="mt-2 text-muted-foreground">
          The leaderboard will rank members by check-ins, miles ridden, and events attended.
        </p>
      </section>
    </>
  );
}
