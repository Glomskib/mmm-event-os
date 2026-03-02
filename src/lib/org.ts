import { createClient } from "@/lib/supabase/server";

const DEFAULT_ORG_SLUG = "making-miles-matter";

export async function getCurrentOrg() {
  const supabase = await createClient();

  // For now, default to making-miles-matter
  // Later: resolve from subdomain, cookie, or user's profile
  const { data: org } = await supabase
    .from("orgs")
    .select("*")
    .eq("slug", DEFAULT_ORG_SLUG)
    .single();

  return org;
}

export async function getOrgBySlug(slug: string) {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("orgs")
    .select("*")
    .eq("slug", slug)
    .single();

  return org;
}

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, orgs(*)")
    .eq("id", user.id)
    .single();

  return profile;
}
