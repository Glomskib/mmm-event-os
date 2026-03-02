import { createAdminClient } from "@/lib/supabase/admin";
import { Users } from "lucide-react";
import { unstable_cache } from "next/cache";

const getRegistrationCount = unstable_cache(
  async (eventId: string) => {
    const admin = createAdminClient();
    const { count } = await admin
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["paid", "free"]);
    return count ?? 0;
  },
  ["event-reg-count"],
  { revalidate: 60 }
);

export async function EventSocialProof({ eventId }: { eventId: string }) {
  const count = await getRegistrationCount(eventId);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Users className="h-3.5 w-3.5" />
      <span>
        {count} rider{count !== 1 ? "s" : ""} registered
      </span>
    </div>
  );
}
