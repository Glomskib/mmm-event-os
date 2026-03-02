"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toggleBibIssued, toggleEmergencyFlag } from "./actions";

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
}

export function EventDayClient({
  participants,
}: {
  participants: Participant[];
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? participants.filter(
        (p) =>
          p.participant_name.toLowerCase().includes(query.toLowerCase()) ||
          p.participant_email.toLowerCase().includes(query.toLowerCase())
      )
    : participants;

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search by name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {participants.length} participants
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No participants match your search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-3 text-left font-medium">Name</th>
                <th className="px-3 py-3 text-left font-medium">Distance</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                <th className="px-3 py-3 text-left font-medium">Waiver</th>
                <th className="px-3 py-3 text-left font-medium">Emergency Contact</th>
                <th className="px-3 py-3 text-left font-medium">Referral</th>
                <th className="px-3 py-3 text-right font-medium">Raffle Tickets</th>
                <th className="px-3 py-3 text-center font-medium">Bib</th>
                <th className="px-3 py-3 text-center font-medium">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <ParticipantRow key={p.id} participant={p} />
              ))}
            </tbody>
          </table>
        </div>
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
    <tr className={`hover:bg-muted/30 ${emergencyFlag ? "bg-destructive/10" : ""}`}>
      <td className="px-3 py-3">
        <div className="font-medium">{p.participant_name}</div>
        <div className="text-xs text-muted-foreground">{p.participant_email}</div>
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
          <span className="text-xs text-destructive font-medium">Missing</span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="text-sm">{p.emergency_contact_name}</div>
        <div className="text-xs text-muted-foreground">
          {p.emergency_contact_phone}
        </div>
      </td>
      <td className="px-3 py-3 text-xs font-mono">
        {p.referral_code || "—"}
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <span title="Referral tickets">{p.raffle_referral}</span>
        {" + "}
        <span title="Main tickets">{p.raffle_main}</span>
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
