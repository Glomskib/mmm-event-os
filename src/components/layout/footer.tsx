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

        {/* Social media icon links */}
        {(org.social.facebook || org.social.instagram || org.social.strava) && (
          <div className="mb-6 flex items-center justify-center gap-4">
            {org.social.facebook && (
              <a
                href={org.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
            {org.social.instagram && (
              <a
                href={org.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            )}
            {org.social.strava && (
              <a
                href={org.social.strava}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Strava"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </a>
            )}
          </div>
        )}

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
