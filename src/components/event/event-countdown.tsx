"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface EventCountdownProps {
  /** ISO date string for the event. */
  eventDate: string;
}

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
};

function calcTimeLeft(dateString: string): TimeLeft | null {
  const diff = new Date(dateString).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

/** Client-side countdown clock, updates every 60 s. Returns null after event date. */
export function EventCountdown({ eventDate }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Initialise on client to avoid hydration mismatch
    setTimeLeft(calcTimeLeft(eventDate));
    const id = setInterval(
      () => setTimeLeft(calcTimeLeft(eventDate)),
      60_000
    );
    return () => clearInterval(id);
  }, [eventDate]);

  if (!timeLeft) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 rounded-xl px-5 py-4"
      style={{ backgroundColor: "var(--brand-navy)" }}
    >
      <Clock
        className="h-4 w-4 shrink-0 text-white/50"
        aria-hidden
      />
      <div className="flex items-center gap-5" role="timer" aria-label="Time until event">
        <Segment value={timeLeft.days} label="days" />
        <Divider />
        <Segment value={timeLeft.hours} label="hrs" />
        <Divider />
        <Segment value={timeLeft.minutes} label="min" />
      </div>
    </div>
  );
}

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span
        className="block text-2xl font-bold tabular-nums text-white sm:text-3xl"
        style={{ minWidth: "2.5ch" }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="block text-[10px] uppercase tracking-widest text-white/50">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <span className="mb-3 self-end text-lg font-bold text-white/30">:</span>
  );
}
