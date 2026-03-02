"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";

interface SendResult {
  ok: boolean;
  emailsSent?: number;
  emailErrors?: number;
  rideCount?: number;
  skipped?: string;
}

export function EmailControlsClient({
  sendTestAction,
  sendLiveAction,
}: {
  sendTestAction: () => Promise<SendResult>;
  sendLiveAction: () => Promise<SendResult>;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<"test" | "live" | null>(null);
  const [result, setResult] = useState<{ type: "test" | "live"; data: SendResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleTest() {
    setActiveAction("test");
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const data = await sendTestAction();
        setResult({ type: "test", data });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
      setActiveAction(null);
    });
  }

  function handleLive() {
    if (!confirm("Send the weekly ride email to ALL opted-in members?")) return;
    setActiveAction("live");
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const data = await sendLiveAction();
        setResult({ type: "live", data });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
      setActiveAction(null);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Weekly Ride Schedule Email
          </CardTitle>
          <CardDescription>
            Sends the upcoming week&apos;s ride schedule to members. The cron job
            runs automatically every Monday at 9am ET, but you can trigger it
            manually here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isPending}
            >
              {isPending && activeAction === "test" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send test to me
            </Button>

            <Button onClick={handleLive} disabled={isPending}>
              {isPending && activeAction === "live" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send live weekly email now
            </Button>
          </div>

          {result && (
            <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {result.data.skipped ? (
                  <p>Skipped: {result.data.skipped}</p>
                ) : (
                  <>
                    <p>
                      {result.type === "test" ? "Test" : "Live"} email sent
                      successfully.
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      {result.data.rideCount} ride{result.data.rideCount === 1 ? "" : "s"} &middot;{" "}
                      {result.data.emailsSent} email{result.data.emailsSent === 1 ? "" : "s"} sent
                      {result.data.emailErrors
                        ? ` · ${result.data.emailErrors} error${result.data.emailErrors === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
