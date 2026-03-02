import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export const metadata = { title: "Members | Admin | MMM Event OS" };

export default async function AdminMembersPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createAdminClient();
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const members = profiles ?? [];
  const admins = members.filter((p) => p.role === "admin");

  return (
    <>
      <Hero
        title="Members"
        subtitle={`${members.length} members · ${admins.length} admins`}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {members.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No members found.
          </p>
        ) : (
          <Card>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Email</th>
                      <th className="px-4 py-2 text-left font-medium">Role</th>
                      <th className="px-4 py-2 text-left font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium">
                          {m.full_name || "—"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {m.email}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={m.role === "admin" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {m.role ?? "member"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString("en-US", {
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
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}
