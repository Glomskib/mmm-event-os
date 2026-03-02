import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side admin guard for use in admin page server components.
 * Redirects to /login if not authenticated, or to / if not an admin.
 * Returns the authenticated admin user profile.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, org_id, email, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return profile;
}

/**
 * API route admin guard.
 * Returns the admin profile or null if not an admin.
 * Use in API routes where redirect isn't appropriate.
 */
export async function getAdminOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, org_id, email, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return profile;
}
