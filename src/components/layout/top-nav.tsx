import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { UserMenu } from "./user-menu";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/rides", label: "Rides" },
  { href: "/checkin", label: "Check In" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/wheels-and-reels", label: "Wheels & Reels" },
];

export function TopNav({ user }: { user: { email: string; full_name?: string | null } | null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          {/* Wordmark */}
          <Link href="/" className="flex items-baseline gap-1 text-xl font-bold tracking-tight">
            <span className="text-primary">MMM</span>
            <span className="mx-0.5 font-light text-foreground/30">·</span>
            <span className="text-foreground">Event OS</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/65 transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-card">
              <div className="mb-6 flex items-baseline gap-1 text-lg font-bold">
                <span className="text-primary">MMM</span>
                <span className="mx-0.5 font-light text-foreground/30">·</span>
                <span className="text-foreground">Event OS</span>
              </div>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
