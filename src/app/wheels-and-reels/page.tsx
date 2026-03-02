import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { Film, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Wheels & Reels | Making Miles Matter" };

export default async function WheelsAndReelsPage() {
  const org = await getCurrentOrg();

  let films: {
    id: string;
    title: string;
    description: string | null;
    trailer_url: string | null;
    poster_url: string | null;
  }[] = [];

  if (org) {
    const db = createAdminClient();
    const { data } = await db
      .from("films")
      .select("id, title, description, trailer_url, poster_url")
      .eq("org_id", org.id)
      .eq("active", true)
      .order("created_at", { ascending: false });
    films = data ?? [];
  }

  return (
    <>
      <Hero
        title="Wheels & Reels"
        subtitle="Ride highlights, community stories, and event recaps."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {films.length === 0 ? (
          <div className="py-20 text-center">
            <Film className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h2 className="mt-6 text-xl font-semibold">Coming Soon</h2>
            <p className="mt-2 text-muted-foreground">
              Video content and ride recaps will live here. Stay tuned!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {films.map((film) => (
              <Card key={film.id} className="overflow-hidden">
                {film.poster_url && (
                  <div className="aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={film.poster_url}
                      alt={film.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{film.title}</CardTitle>
                  {film.description && (
                    <CardDescription>{film.description}</CardDescription>
                  )}
                </CardHeader>
                {film.trailer_url && (
                  <CardContent>
                    <a
                      href={film.trailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Watch
                    </a>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
