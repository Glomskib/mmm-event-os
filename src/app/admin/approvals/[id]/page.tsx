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
import { ApprovalActions } from "./approval-actions";
import Link from "next/link";

/* eslint-disable @next/next/no-img-element */

export const metadata = { title: "Approval Detail | Admin | MMM Event OS" };

function SocialPreviewCard({
  approval,
}: {
  approval: {
    body_json: unknown;
    channel_targets: unknown;
    media_urls: string[] | null;
    scheduled_for: string | null;
    error_message: string | null;
  };
}) {
  const bodyJson = approval.body_json as Record<string, unknown> | null;
  const content = (bodyJson?.content as string) ?? "";
  const channels = approval.channel_targets as Record<string, boolean> | null;
  const selectedChannels = channels
    ? Object.entries(channels)
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Social Post Preview</CardTitle>
        <CardDescription>
          Targets: {selectedChannels.join(", ") || "none selected"}
          {approval.scheduled_for &&
            ` — Scheduled for ${new Date(approval.scheduled_for).toLocaleString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {approval.error_message && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            Last error: {approval.error_message}
          </div>
        )}
        <div className="whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm">
          {content || "(no content)"}
        </div>
        {approval.media_urls && approval.media_urls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {approval.media_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Media ${i + 1}`}
                className="h-24 w-24 rounded-md border object-cover"
              />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {selectedChannels.map((ch) => (
            <Badge key={ch} variant="secondary">
              {ch}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getCurrentOrg();
  if (!org) {
    return <div className="p-8 text-center text-red-600">Org not found</div>;
  }

  const admin = createAdminClient();

  const { data: approval } = await admin
    .from("approvals")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!approval) {
    return (
      <div className="p-8 text-center text-red-600">Approval not found</div>
    );
  }

  return (
    <>
      <Hero
        title={approval.title}
        subtitle={`${approval.type.replace(/_/g, " ")} — created ${new Date(
          approval.created_at
        ).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`}
      />

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        {/* Status + Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Status</CardTitle>
                <StatusBadge status={approval.status} />
              </div>
              <Link
                href="/admin/approvals"
                className="text-sm text-muted-foreground hover:underline"
              >
                &larr; Back to list
              </Link>
            </div>
            {approval.reviewer_notes && (
              <CardDescription>
                Reviewer notes: {approval.reviewer_notes}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ApprovalActions id={approval.id} status={approval.status} />
          </CardContent>
        </Card>

        {/* Social Post Preview */}
        {approval.type === "social_post" && (
          <SocialPreviewCard approval={approval} />
        )}

        {/* Email Preview */}
        {approval.body_html && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Preview</CardTitle>
              <CardDescription>
                This is how the email will appear to recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-white p-4">
                <div
                  dangerouslySetInnerHTML={{ __html: approval.body_html }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        {approval.body_json &&
          typeof approval.body_json === "object" &&
          Object.keys(approval.body_json).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payload Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
                  {JSON.stringify(approval.body_json, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
      </section>
    </>
  );
}

function SocialPreviewCard({
  approval,
}: {
  approval: {
    body_json: unknown;
    channel_targets: unknown;
    media_urls: string[] | null;
    scheduled_for: string | null;
    error_message: string | null;
  };
}) {
  const bodyJson = approval.body_json as Record<string, unknown> | null;
  const postText = bodyJson?.content ? String(bodyJson.content) : null;
  const channelTargets = approval.channel_targets as Record<
    string,
    boolean
  > | null;
  const activeChannels = channelTargets
    ? Object.entries(channelTargets)
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Social Post Preview</CardTitle>
        <CardDescription>
          This is what will be published to{" "}
          {activeChannels.length > 0
            ? activeChannels.join(", ")
            : "selected channels"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post text */}
        {postText && (
          <div className="whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm">
            {postText}
          </div>
        )}

        {/* Image thumbnails */}
        {approval.media_urls && approval.media_urls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {approval.media_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Attachment ${i + 1}`}
                className="h-24 w-24 rounded-lg border object-cover"
              />
            ))}
          </div>
        )}

        {/* Channel badges */}
        {activeChannels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeChannels.map((ch) => (
              <Badge key={ch} variant="secondary">
                {ch}
              </Badge>
            ))}
          </div>
        )}

        {/* Scheduled time */}
        {approval.scheduled_for && (
          <p className="text-sm text-muted-foreground">
            Scheduled for:{" "}
            {new Date(approval.scheduled_for).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}

        {/* Error message */}
        {approval.error_message && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            Last error: {approval.error_message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
