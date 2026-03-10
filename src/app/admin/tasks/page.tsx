import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { TasksClient } from "./tasks-client";

export const metadata = { title: "Tasks | Admin" };

export default async function TasksPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: tasks }, { data: events }] = await Promise.all([
    db
      .from("tasks")
      .select("*")
      .eq("org_id", org.id)
      .order("due_date", { ascending: true }),
    db
      .from("events")
      .select("id, title")
      .eq("org_id", org.id)
      .eq("status", "published"),
  ]);

  return (
    <>
      <Hero title="Task Board" subtitle="Track coordinator tasks" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TasksClient orgId={org.id} tasks={tasks ?? []} events={events ?? []} />
      </section>
    </>
  );
}
