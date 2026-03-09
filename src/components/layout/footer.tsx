import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { getOrgConfig } from "@/lib/org-config";

export function Footer() {
  const org = getOrgConfig();
  return (
    <footer
      className="mt-auto"
      style={{ background: "var(--brand-navy)", color: "white" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Events</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link
                  href="/events"
                  className="transition-colors hover:text-white"
                >
                  All Events
                </Link>
              </li>
              <li>
                <Link
                  href="/rides"
                  className="transition-colors hover:text-white"
                >
                  Group Rides
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="transition-colors hover:text-white"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Get Involved</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link
                  href="/volunteer"
                  className="transition-colors hover:text-white"
                >
                  Volunteer
                </Link>
              </li>
              <li>
                <Link
                  href="/donate"
                  className="transition-colors hover:text-white"
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link
                  href="/sponsors"
                  className="transition-colors hover:text-white"
                >
                  Sponsors
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">About</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-white"
                >
                  Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="transition-colors hover:text-white"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/wheels-and-reels"
                  className="transition-colors hover:text-white"
                >
                  Wheels &amp; Reels
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Stay Updated</h3>
            <p className="mt-3 text-sm text-white/60">
              Get event updates, ride schedules, and community news.
            </p>
            <div className="mt-3">
              <NewsletterSignup variant="footer" />
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
            {org.name} Inc. &middot; {org.nonprofit.type}
          </p>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} {org.name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
