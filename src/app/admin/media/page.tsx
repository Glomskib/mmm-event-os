import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { getAllEntityMedia } from "@/lib/media";
import { MediaClient } from "./media-client";

export const metadata = { title: "Media | Admin | MMM Event OS" };

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const { event_id } = await searchParams;
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center text-red-600">Org not found</p>;

  const admin = createAdminClient();

  // Fetch all events (draft + published) for the event selector
  const { data: events } = await admin
    .from("events")
    .select("id, title, status, date")
    .eq("org_id", org.id)
    .in("status", ["draft", "published"])
    .order("date", { ascending: true });

  const eventList = events ?? [];
  const selectedEventId = event_id ?? eventList[0]?.id ?? null;

  // Fetch all media for the selected event (including inactive, for admin)
  const media = selectedEventId
    ? await getAllEntityMedia(selectedEventId)
    : [];

  return (
    <>
      <Hero
        title="Media Manager"
        subtitle="Upload photos, videos, and embeds for events"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <MediaClient
          events={eventList}
          selectedEventId={selectedEventId}
          initialMedia={media}
        />
      </section>
    </>
  );
}
