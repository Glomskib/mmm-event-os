"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ApprovalActions({
  id,
  status,
  type,
  hasError,
}: {
  id: string;
  status: string;
  type?: string;
  hasError?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  async function handleAction(action: "approve" | "reject" | "send") {
    setLoading(action);
    setResult(null);

    try {
      const body: Record<string, string> = { id };
      if (notes.trim()) {
        body.notes = notes.trim();
      }

      const res = await fetch(`/api/approvals/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "Request failed" });
        return;
      }

      const messages: Record<string, string> = {
        approve: "Approved successfully.",
        reject: "Rejected.",
        send:
          data.emailsSent != null
            ? `Sent to ${data.emailsSent} recipient(s).`
            : "Sent.",
      };

      setResult({ ok: true, message: messages[action] });
      router.refresh();
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Notes input (for approve/reject) */}
      {(status === "draft" || status === "approved") && (
        <div>
          <label
            htmlFor="reviewer-notes"
            className="mb-1 block text-sm font-medium"
          >
            Reviewer Notes (optional)
          </label>
          <textarea
            id="reviewer-notes"
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={2}
            placeholder="Add a note for the record..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {status === "draft" && (
          <>
            <Button
              onClick={() => handleAction("approve")}
              disabled={loading !== null}
            >
              {loading === "approve" ? "Approving..." : "Approve"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction("reject")}
              disabled={loading !== null}
            >
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </Button>
          </>
        )}

        {status === "approved" && (
          <>
            <Button
              onClick={() => handleAction("send")}
              disabled={loading !== null}
            >
              {loading === "send"
                ? "Sending..."
                : hasError && type === "social_post"
                  ? "Retry Publish"
                  : "Send Now"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction("reject")}
              disabled={loading !== null}
            >
              {loading === "reject" ? "Rejecting..." : "Reject Instead"}
            </Button>
          </>
        )}

        {status === "scheduled" && type === "social_post" && (
          <>
            {hasError && (
              <Button
                variant="outline"
                onClick={() => handleAction("send")}
                disabled={loading !== null}
              >
                {loading === "send" ? "Retrying..." : "Retry Publish"}
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {hasError
                ? "Last publish attempt failed. You can retry now."
                : "Scheduled — the cron will publish this automatically."}
            </p>
          </>
        )}

        {status === "sent" && (
          <p className="text-sm text-muted-foreground">
            This item has been sent. No further actions available.
          </p>
        )}

        {status === "rejected" && (
          <p className="text-sm text-muted-foreground">
            This item was rejected. No further actions available.
          </p>
        )}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            result.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
