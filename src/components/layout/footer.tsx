import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{ background: "var(--brand-navy)", color: "white" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Events</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link href="/events" className="transition-colors hover:text-white">
                  Upcoming
                </Link>
              </li>
              <li>
                <Link href="/rides" className="transition-colors hover:text-white">
                  Group Rides
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Community</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link href="/leaderboard" className="transition-colors hover:text-white">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/hhh-legacy" className="transition-colors hover:text-white">
                  HHH Legacy Board
                </Link>
              </li>
              <li>
                <Link href="/wheels-and-reels" className="transition-colors hover:text-white">
                  Wheels &amp; Reels
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link href="/login" className="transition-colors hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="transition-colors hover:text-white">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">About</h3>
            <p className="mt-3 text-sm text-white/60">
              Making Miles Matter — community events, rides, and more.
            </p>
          </div>
        </div>

        <Separator className="my-6 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
            Making Miles Matter
          </p>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Making Miles Matter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
