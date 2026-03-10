import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Hero } from "@/components/layout/hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, HandHeart } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Volunteer Signups | Admin" };

type VolunteerSignup = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
};

export default async function VolunteersPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: raw } = await db
    .from("volunteer_signups")
    .select("*")
    .order("created_at", { ascending: false });

  const signups = (raw ?? []) as VolunteerSignup[];

  return (
    <>
      <Hero title="Volunteer Signups" />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="h-5 w-5" />
              All Signups ({signups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No volunteer signups yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Phone</th>
                      <th className="pb-2 pr-4">Message</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {signups.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 pr-4 font-medium">{s.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {s.email}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {s.phone || "\u2014"}
                        </td>
                        <td className="max-w-xs truncate py-2 pr-4 text-muted-foreground">
                          {s.message || "\u2014"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
