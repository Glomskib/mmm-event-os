"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { Download } from "lucide-react";
import { toggleBibIssued, toggleEmergencyFlag } from "./actions";

const PER_PAGE = 25;

export interface Participant {
  id: string;
  participant_name: string;
  participant_email: string;
  distance: string;
  status: string;
  waiver_accepted: boolean;
  waiver_accepted_at: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  referral_code: string;
  bib_issued: boolean;
  emergency_flag: boolean;
  raffle_referral: number;
  raffle_main: number;
  early_merch_perk: string[];
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function EventDayClient({
  participants,
}: {
  participants: Participant[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(query, 300);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return participants;
    const q = debouncedQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.participant_name.toLowerCase().includes(q) ||
        p.participant_email.toLowerCase().includes(q)
    );
  }, [participants, debouncedQuery]);

  // Reset to page 1 when search changes
  useEffect(() => setPage(1), [debouncedQuery]);

  const { pageItems, totalPages, page: safePage } = usePagination(
    filtered,
    PER_PAGE,
    page
  );

  function exportCsv() {
    const header = [
      "Name",
      "Email",
      "Distance",
      "Status",
      "Waiver",
      "Emergency Contact",
      "Emergency Phone",
      "Referral Code",
      "Raffle (Referral)",
      "Raffle (Main)",
      "Bib Issued",
      "Emergency Flag",
      "Early Merch Perks",
    ];
    const rows = filtered.map((p) => [
      p.participant_name,
      p.participant_email,
      p.distance,
      p.status,
      p.waiver_accepted ? "Signed" : "Missing",
      p.emergency_contact_name,
      p.emergency_contact_phone,
      p.referral_code,
      String(p.raffle_referral),
      String(p.raffle_main),
      p.bib_issued ? "Yes" : "No",
      p.emergency_flag ? "Yes" : "No",
      p.early_merch_perk.join("; "),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-day-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {participants.length} participants
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No participants match your search.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b">
                  <th className="px-3 py-3 text-left font-medium">Name</th>
                  <th className="px-3 py-3 text-left font-medium">Distance</th>
                  <th className="px-3 py-3 text-left font-medium">Status</th>
                  <th className="px-3 py-3 text-left font-medium">Waiver</th>
                  <th className="px-3 py-3 text-left font-medium">
                    Emergency Contact
                  </th>
                  <th className="px-3 py-3 text-left font-medium">Referral</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Raffle Tickets
                  </th>
                  <th className="px-3 py-3 text-left font-medium">Perks</th>
                  <th className="px-3 py-3 text-center font-medium">Bib</th>
                  <th className="px-3 py-3 text-center font-medium">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageItems.map((p) => (
                  <ParticipantRow key={p.id} participant={p} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function ParticipantRow({ participant: p }: { participant: Participant }) {
  const [bibIssued, setBibIssued] = useState(p.bib_issued);
  const [emergencyFlag, setEmergencyFlag] = useState(p.emergency_flag);
  const [isPending, startTransition] = useTransition();

  function handleBibToggle() {
    const next = !bibIssued;
    setBibIssued(next);
    startTransition(async () => {
      try {
        await toggleBibIssued(p.id, next);
      } catch {
        setBibIssued(!next); // rollback
      }
    });
  }

  function handleFlagToggle() {
    const next = !emergencyFlag;
    setEmergencyFlag(next);
    startTransition(async () => {
      try {
        await toggleEmergencyFlag(p.id, next);
      } catch {
        setEmergencyFlag(!next); // rollback
      }
    });
  }

  return (
    <tr
      className={`hover:bg-muted/30 ${emergencyFlag ? "bg-destructive/10" : ""}`}
    >
      <td className="px-3 py-3">
        <div className="font-medium">{p.participant_name}</div>
        <div className="text-xs text-muted-foreground">
          {p.participant_email}
        </div>
      </td>
      <td className="px-3 py-3">{p.distance}</td>
      <td className="px-3 py-3">
        <Badge variant={p.status === "paid" ? "default" : "secondary"}>
          {p.status}
        </Badge>
      </td>
      <td className="px-3 py-3">
        {p.waiver_accepted ? (
          <span className="text-xs text-green-600">
            Signed{" "}
            {p.waiver_accepted_at
              ? new Date(p.waiver_accepted_at).toLocaleDateString()
              : ""}
          </span>
        ) : (
          <span className="text-xs font-medium text-destructive">Missing</span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="text-sm">{p.emergency_contact_name}</div>
        <div className="text-xs text-muted-foreground">
          {p.emergency_contact_phone}
        </div>
      </td>
      <td className="px-3 py-3 font-mono text-xs">
        {p.referral_code || "\u2014"}
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <span title="Referral tickets">{p.raffle_referral}</span>
        {" + "}
        <span title="Main tickets">{p.raffle_main}</span>
      </td>
      <td className="px-3 py-3">
        {p.early_merch_perk.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {p.early_merch_perk.map((perk) => (
              <Badge key={perk} variant="outline" className="text-xs border-amber-500 text-amber-700">
                {perk}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">\u2014</span>
        )}
      </td>
      <td className="px-3 py-3 text-center">
        <button
          onClick={handleBibToggle}
          disabled={isPending}
          className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-bold transition-colors ${
            bibIssued
              ? "border-green-600 bg-green-600 text-white"
              : "border-muted-foreground/30 text-muted-foreground hover:border-green-600"
          }`}
          title={bibIssued ? "Bib issued" : "Mark bib issued"}
        >
          {bibIssued ? "\u2713" : ""}
        </button>
      </td>
      <td className="px-3 py-3 text-center">
        <button
          onClick={handleFlagToggle}
          disabled={isPending}
          className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-bold transition-colors ${
            emergencyFlag
              ? "border-destructive bg-destructive text-white"
              : "border-muted-foreground/30 text-muted-foreground hover:border-destructive"
          }`}
          title={emergencyFlag ? "Emergency flagged" : "Flag emergency"}
        >
          {emergencyFlag ? "!" : ""}
        </button>
      </td>
    </tr>
  );
}
