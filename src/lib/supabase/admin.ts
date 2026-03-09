import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Service-role client — only use in server-side code (API routes, server actions)
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Untyped admin client for tables not yet in generated types.
 * Use this temporarily until `npx supabase gen types` is re-run
 * after migration 00035 (email_campaigns, email_subscribers, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUntypedAdminClient(): ReturnType<typeof createClient<any>> {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
