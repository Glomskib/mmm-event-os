import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { VolunteerAssignmentsClient } from "./assignments-client";

export const metadata = { title: "Volunteer Assignments | Admin" };

export default async function VolunteerAssignmentsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: assignments }, { data: volunteers }, { data: events }] = await Promise.all([
    db.from("volunteer_assignments").select("*").eq("org_id", org.id).order("shift_start"),
    db.from("volunteer_signups").select("id, name, email, phone").order("name"),
    db.from("events").select("id, title").eq("org_id", org.id).eq("status", "published"),
  ]);

  return (
    <>
      <Hero title="Volunteer Assignments" subtitle="Assign shifts and track hours" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <VolunteerAssignmentsClient
          orgId={org.id}
          assignments={assignments ?? []}
          volunteers={volunteers ?? []}
          events={events ?? []}
        />
      </section>
    </>
  );
}
