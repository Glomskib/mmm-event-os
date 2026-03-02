"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleBibIssued(registrationId: string, value: boolean) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("registrations")
    .update({ bib_issued: value })
    .eq("id", registrationId);

  if (error) throw new Error("Failed to update bib_issued");
  revalidatePath("/admin/event-day");
}

export async function toggleEmergencyFlag(
  registrationId: string,
  value: boolean
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("registrations")
    .update({ emergency_flag: value })
    .eq("id", registrationId);

  if (error) throw new Error("Failed to update emergency_flag");
  revalidatePath("/admin/event-day");
}
