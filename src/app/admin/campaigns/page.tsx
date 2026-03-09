import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Mail, Users, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Email Campaigns | Admin" };

export default async function CampaignsPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data: campaigns } = await db
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: subscriberCount } = await db
    .from("email_subscribers")
    .select("*", { count: "exact", head: true })
    .is("unsubscribed_at", null);

  const items = (campaigns ?? []) as {
    id: string;
    subject: string;
    preview_text: string | null;
    status: string;
    created_at: string;
    total_sent: number;
    total_opened: number;
    tags_filter: string[];
  }[];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Users className="mr-1 inline h-4 w-4" />
            {subscriberCount ?? 0} active subscribers
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/campaigns/subscribers">
            <Button variant="outline" size="sm" className="gap-1">
              <Users className="h-4 w-4" /> Subscribers
            </Button>
          </Link>
          <Link href="/admin/campaigns/new">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((c) => (
            <Link key={c.id} href={`/admin/campaigns/${c.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.subject}</CardTitle>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.preview_text && (
                    <CardDescription className="line-clamp-1">
                      {c.preview_text}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {c.status === "sent" && (
                    <>
                      <span>Sent: {c.total_sent}</span>
                      <span>Opened: {c.total_opened}</span>
                    </>
                  )}
                  {c.tags_filter?.length > 0 && (
                    <span>Tags: {c.tags_filter.join(", ")}</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium">No campaigns yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first email campaign to reach your subscribers.
          </p>
          <div className="mt-4">
            <Link href="/admin/campaigns/new">
              <Button className="gap-1">
                <Plus className="h-4 w-4" /> Create Campaign
              </Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
