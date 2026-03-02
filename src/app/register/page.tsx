import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterClient } from "./register-client";

export const metadata = { title: "Continue to Registration | Making Miles Matter" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string; distance?: string }>;
}) {
  const { event_id, distance } = await searchParams;

  // Build the post-auth destination
  const next =
    event_id
      ? `/waiver?event_id=${event_id}${distance ? `&distance=${encodeURIComponent(distance)}` : ""}`
      : "/events";

  // If already signed in, skip straight to the waiver
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <RegisterClient next={next} />
    </div>
  );
}
