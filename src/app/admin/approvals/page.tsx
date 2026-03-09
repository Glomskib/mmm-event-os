import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = { title: "Approvals | Admin" };

const STATUS_ORDER = ["draft", "approved", "rejected", "sent"];

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: typeFilter } = await searchParams;
  const org = await getCurrentOrg();
  if (!org) {
    return <div className="p-8 text-center text-red-600">Org not found</div>;
  }

  const admin = createAdminClient();

  const { data: approvals } = await admin
    .from("approvals")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const allItems = approvals ?? [];

  // Compute type counts for filter tabs
  const typeCounts = new Map<string, number>();
  for (const item of allItems) {
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1);
  }

  // Apply type filter
  const items = typeFilter
    ? allItems.filter((a) => a.type === typeFilter)
    : allItems;

  // Group by status
  const grouped: Record<string, typeof items> = {};
  for (const status of STATUS_ORDER) {
    grouped[status] = items.filter((a) => a.status === status);
  }

  const draftCount = grouped.draft.length;
  const approvedCount = grouped.approved.length;

  return (
    <>
      <Hero
        title="Approvals"
        subtitle="Review and approve content before it goes out"
      />

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        {/* Type filter tabs */}
        {typeCounts.size > 1 && (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/approvals">
              <Badge variant={!typeFilter ? "default" : "outline"}>
                All ({allItems.length})
              </Badge>
            </Link>
            {[...typeCounts.entries()].map(([type, count]) => (
              <Link key={type} href={`/admin/approvals?type=${type}`}>
                <Badge
                  variant={typeFilter === type ? "default" : "outline"}
                >
                  {type.replace(/_/g, " ")} ({count})
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Quick stats */}
        <div className="flex gap-4">
          {draftCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
              <span className="text-2xl font-bold text-yellow-800">
                {draftCount}
              </span>
              <span className="text-sm text-yellow-700">pending review</span>
            </div>
          )}
          {approvedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
              <span className="text-2xl font-bold text-green-800">
                {approvedCount}
              </span>
              <span className="text-sm text-green-700">ready to send</span>
            </div>
          )}
          {draftCount === 0 && approvedCount === 0 && (
            <p className="text-sm text-muted-foreground">
              No pending approvals. Drafts will appear here when cron jobs run
              or you create a social post draft.
            </p>
          )}
        </div>

        {/* Draft items (needs review) */}
        {grouped.draft.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Review</CardTitle>
              <CardDescription>
                These items need your approval before they can be sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.draft.map((item) => (
                  <ApprovalRow key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved items (ready to send) */}
        {grouped.approved.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approved — Ready to Send</CardTitle>
              <CardDescription>
                Click into an item to send it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.approved.map((item) => (
                  <ApprovalRow key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sent items */}
        {grouped.sent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.sent.map((item) => (
                  <ApprovalRow key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected items */}
        {grouped.rejected.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.rejected.map((item) => (
                  <ApprovalRow key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}

function ApprovalRow({
  item,
}: {
  item: {
    id: string;
    type: string;
    status: string;
    title: string;
    created_at: string;
    reviewer_notes: string | null;
    body_json: unknown;
    channel_targets: unknown;
  };
}) {
  // Extract social post preview text
  const bodyJson = item.body_json as Record<string, unknown> | null;
  const postText =
    item.type === "social_post" && bodyJson?.content
      ? String(bodyJson.content)
      : null;

  // Extract channel names for social posts
  const channelTargets =
    item.type === "social_post"
      ? (item.channel_targets as Record<string, boolean> | null)
      : null;
  const activeChannels = channelTargets
    ? Object.entries(channelTargets)
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];

  return (
    <Link
      href={`/admin/approvals/${item.id}`}
      className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.title}</span>
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5">{item.type.replace(/_/g, " ")}</span>
          <span>
            {new Date(item.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {item.reviewer_notes && (
            <span className="italic">Note: {item.reviewer_notes}</span>
          )}
        </div>
        {/* Social post preview */}
        {postText && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
            {postText}
          </p>
        )}
        {activeChannels.length > 0 && (
          <div className="mt-1.5 flex gap-1">
            {activeChannels.map((ch) => (
              <Badge key={ch} variant="secondary" className="text-[10px] px-1.5 py-0">
                {ch}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <span className="ml-4 text-muted-foreground">&rarr;</span>
    </Link>
  );
}
