import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/event-slug";
import { getDistances } from "@/lib/pricing";
import { RegistrationWizard } from "./wizard-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("title, slug")
    .eq("status", "published");

  const event = events?.find((e) => (e.slug ?? slugify(e.title)) === slug);
  return {
    title: event
      ? `Register for ${event.title} | Making Miles Matter`
      : "Register | Making Miles Matter",
  };
}

export default async function RegisterWizardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ distance?: string; ref?: string; step?: string }>;
}) {
  const { slug } = await params;
  const { distance = "", ref = "" } = await searchParams;

  const supabase = await createClient();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, slug, date, location, description, status")
    .eq("status", "published");

  // Surface DB errors as 500 rather than silently 404ing (e.g. missing migrations)
  if (eventsError) {
    console.error("[register/slug] events query failed:", eventsError.message);
    throw new Error(`Database error: ${eventsError.message}`);
  }

  const event = events?.find((e) => (e.slug ?? slugify(e.title)) === slug);
  if (!event) notFound();

  const distances = getDistances(event.title);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pre-fetch profile for field pre-fill (server-side, no extra client fetch needed)
  let userFullName: string | null = null;
  let userEmail: string | null = user?.email ?? null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    userFullName = profile?.full_name ?? null;
    userEmail = profile?.email ?? user.email ?? null;
  }

  const eventSlug = event.slug ?? slugify(event.title);

  return (
    <RegistrationWizard
      event={{
        id: event.id,
        title: event.title,
        slug: eventSlug,
        date: event.date,
        location: event.location ?? null,
        description: event.description ?? null,
      }}
      distances={distances}
      isAuthed={!!user}
      userEmail={userEmail}
      userFullName={userFullName}
      initialDistance={distance}
      initialRef={ref}
    />
  );
}
