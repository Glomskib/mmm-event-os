import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold">Events</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/events" className="hover:text-foreground">Upcoming</Link></li>
              <li><Link href="/rides" className="hover:text-foreground">Group Rides</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Community</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
              <li><Link href="/wheels-and-reels" className="hover:text-foreground">Wheels & Reels</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground">Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-foreground">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">About</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Making Miles Matter — community events, rides, and more.
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Making Miles Matter. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
