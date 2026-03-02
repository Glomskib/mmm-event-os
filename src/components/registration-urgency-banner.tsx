import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { Users } from "lucide-react";

export async function RegistrationUrgencyBanner() {
  const org = await getCurrentOrg();
  if (!org) return null;

  const supabase = await createClient();

  const { count } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("status", "paid");

  if (!count || count === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm">
      <Users className="h-4 w-4" />
      <span>
        {count.toLocaleString()} rider{count === 1 ? "" : "s"} registered
      </span>
      <span className="text-blue-200">&mdash; don&apos;t miss out!</span>
    </div>
  );
}
