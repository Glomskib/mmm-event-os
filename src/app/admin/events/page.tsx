import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { EventsClient } from "./events-client";
import { setEventStatus, createEvent, updateEvent } from "./actions";

export const metadata = { title: "Events | Admin | MMM Event OS" };

export default async function AdminEventsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createAdminClient();
  const { data: events } = await db
    .from("events")
    .select(
      "id, title, slug, status, date, location, description, registration_open, capacity, series_key"
    )
    .eq("org_id", org.id)
    .order("date", { ascending: false });

  return (
    <>
      <Hero
        title="Events"
        subtitle="Create and manage events. Click a title to edit; use the action buttons to publish or cancel."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EventsClient
          events={events ?? []}
          orgId={org.id}
          setEventStatusAction={setEventStatus}
          createEventAction={createEvent}
          updateEventAction={updateEvent}
        />
      </section>
    </>
  );
}
