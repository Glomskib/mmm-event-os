import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { EventDayClient } from "./event-day-client";

export const metadata = { title: "Event Day | Admin | MMM Event OS" };

export default async function EventDayPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  const admin = createAdminClient();

  // Parallel fetch: registrations and all raffle entries for the org
  const [{ data: registrations }, { data: raffleEntries }] = await Promise.all([
    admin
      .from("registrations")
      .select(
        "id, participant_name, participant_email, distance, status, waiver_accepted, waiver_accepted_at, emergency_contact_name, emergency_contact_phone, referral_code, bib_issued, emergency_flag, user_id, event_id"
      )
      .eq("org_id", org.id)
      .in("status", ["paid", "free"])
      .order("participant_name", { ascending: true }),
    admin
      .from("raffle_entries")
      .select("user_id, tickets_count, source")
      .eq("org_id", org.id),
  ]);

  const regs = registrations ?? [];

  // Aggregate tickets by user: referral vs main
  const ticketMap = new Map<
    string,
    { referral: number; main: number }
  >();
  for (const entry of raffleEntries ?? []) {
    const existing = ticketMap.get(entry.user_id) ?? {
      referral: 0,
      main: 0,
    };
    if (entry.source === "referral") {
      existing.referral += entry.tickets_count;
    } else {
      existing.main += entry.tickets_count;
    }
    ticketMap.set(entry.user_id, existing);
  }

  // Build participant list for client
  const participants = regs.map((r) => {
    const tickets = ticketMap.get(r.user_id ?? "") ?? { referral: 0, main: 0 };
    return {
      id: r.id,
      participant_name: r.participant_name ?? "",
      participant_email: r.participant_email ?? "",
      distance: r.distance,
      status: r.status,
      waiver_accepted: r.waiver_accepted,
      waiver_accepted_at: r.waiver_accepted_at,
      emergency_contact_name: r.emergency_contact_name ?? "",
      emergency_contact_phone: r.emergency_contact_phone ?? "",
      referral_code: r.referral_code ?? "",
      bib_issued: r.bib_issued,
      emergency_flag: r.emergency_flag,
      raffle_referral: tickets.referral,
      raffle_main: tickets.main,
    };
  });

  return (
    <>
      <Hero
        title="Event Day"
        subtitle={`${participants.length} active participants`}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EventDayClient participants={participants} />
      </section>
    </>
  );
}
