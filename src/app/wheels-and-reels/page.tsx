import { Hero } from "@/components/layout/hero";
import { Film } from "lucide-react";

export const metadata = { title: "Wheels & Reels | MMM Event OS" };

export default function WheelsAndReelsPage() {
  return (
    <>
      <Hero
        title="Wheels & Reels"
        subtitle="Ride highlights, community stories, and event recaps."
      />

      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Film className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-6 text-xl font-semibold">Coming Soon</h2>
        <p className="mt-2 text-muted-foreground">
          Video content and ride recaps will live here. Stay tuned!
        </p>
      </section>
    </>
  );
}
