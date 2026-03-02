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
import { ApprovalActions } from "./approval-actions";
import Link from "next/link";

export const metadata = { title: "Approval Detail | Admin | MMM Event OS" };

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
