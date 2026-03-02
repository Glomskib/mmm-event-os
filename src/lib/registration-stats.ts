import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegistrationStats = {
  total_registered: number;
  capacity: number | null;
  spots_remaining: number | null;
};

/** Cached 60 s — counts paid + free registrations for an event. */
const fetchRegistrationCount = unstable_cache(
  async (eventId: string): Promise<number> => {
    const admin = createAdminClient();
    const { count } = await admin
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["paid", "free"]);
    return count ?? 0;
  },
  ["registration-count"],
  { revalidate: 60 }
);

export async function getEventRegistrationStats(
  eventId: string,
  capacity: number | null
): Promise<RegistrationStats> {
  const total_registered = await fetchRegistrationCount(eventId);
  const spots_remaining =
    capacity !== null ? Math.max(0, capacity - total_registered) : null;
  return { total_registered, capacity, spots_remaining };
}
