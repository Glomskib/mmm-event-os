"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function EarlyBirdCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = getTimeLeft(deadline);
      setTimeLeft(tl);
      if (!tl) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
      <Clock className="h-3.5 w-3.5" />
      <span>Early bird ends in</span>
      <span className="tabular-nums">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
