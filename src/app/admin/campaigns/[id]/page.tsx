import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { CampaignEditor } from "../campaign-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Campaign = {
  id: string;
  subject: string;
  preview_text: string | null;
  body_html: string;
  tags_filter: string[];
  status: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: raw } = await db
    .from("email_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!raw) notFound();
  const campaign = raw as Campaign;

  const isSent = campaign.status === "sent";

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/admin/campaigns">
        <Button variant="ghost" size="sm" className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </Link>

      {isSent ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{campaign.subject}</h1>
            <StatusBadge status={campaign.status} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{campaign.total_sent}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaign.total_opened}</p>
                  <p className="text-xs text-muted-foreground">Opened</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaign.total_clicked}</p>
                  <p className="text-xs text-muted-foreground">Clicked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.body_html }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <h1 className="mb-6 text-2xl font-bold">Edit Campaign</h1>
          <CampaignEditor campaign={campaign} />
        </>
      )}
    </section>
  );
}
