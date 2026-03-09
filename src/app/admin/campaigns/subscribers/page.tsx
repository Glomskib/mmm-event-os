import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Subscribers | Admin" };

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  tags: string[];
  created_at: string;
  unsubscribed_at: string | null;
};

export default async function SubscribersPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: raw } = await db
    .from("email_subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const subscribers = (raw ?? []) as Subscriber[];
  const active = subscribers.filter((s) => !s.unsubscribed_at);
  const unsubscribed = subscribers.filter((s) => s.unsubscribed_at);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/admin/campaigns">
        <Button variant="ghost" size="sm" className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Campaigns
        </Button>
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Subscribers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length} active, {unsubscribed.length} unsubscribed
          </p>
        </div>
        <Link href="/admin/campaigns/import">
          <Button size="sm" className="gap-1">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Subscribers ({active.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subscribers yet. Share your newsletter signup!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2 pr-4">Tags</th>
                    <th className="pb-2">Subscribed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {active.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-4 font-medium">{s.email}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.name || "\u2014"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.source}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {s.tags?.map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
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
  );
}
