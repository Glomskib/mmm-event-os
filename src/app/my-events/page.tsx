import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/layout/hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Download, Ticket } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/event-slug";

export const metadata = { title: "My Events | Making Miles Matter" };

type RegStatus = "pending" | "paid" | "refunded" | "cancelled" | "free";

type RegWithEvent = {
  id: string;
  status: string;
  distance: string;
  amount: number;
  created_at: string;
  waiver_pdf_url: string | null;
  events: {
    id: string;
    title: string;
    slug: string | null;
    date: string;
    location: string | null;
  } | null;
};

function statusLabel(status: RegStatus | string): string {
  switch (status) {
    case "paid":
      return "Registered";
    case "free":
      return "Registered (Free)";
    case "pending":
      return "In Progress";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function statusVariant(
  status: RegStatus | string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid" || status === "free") return "default";
  if (status === "pending") return "secondary";
  return "outline";
}

function formatAmount(cents: number): string {
  if (!cents || cents === 0) return "$0";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function RegistrationCard({ reg }: { reg: RegWithEvent }) {
  const ev = reg.events;
  if (!ev) return null;
  const eventSlug = ev.slug ?? slugify(ev.title);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{ev.title}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {ev.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(ev.date)}
                </span>
              )}
              {ev.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ev.location}
                </span>
              )}
            </div>
          </div>
          <Badge variant={statusVariant(reg.status)} className="shrink-0 text-xs">
            {statusLabel(reg.status)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {reg.distance && (
            <span>
              <span className="font-medium text-foreground">{reg.distance}</span>
            </span>
          )}
          <span>{formatAmount(reg.amount)}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/events/${eventSlug}`}>
            <Button variant="outline" size="sm">
              View Event
            </Button>
          </Link>

          {reg.status === "pending" && (
            <Link
              href={`/waiver?event_id=${ev.id}&distance=${encodeURIComponent(reg.distance)}`}
            >
              <Button size="sm">Finish Registration</Button>
            </Link>
          )}

          {reg.waiver_pdf_url && (
            <a href={reg.waiver_pdf_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Waiver PDF
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  regs,
}: {
  title: string;
  regs: RegWithEvent[];
}) {
  if (regs.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({regs.length})
      </h2>
      {regs.map((r) => (
        <RegistrationCard key={r.id} reg={r} />
      ))}
    </div>
  );
}

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/my-events");
  }

  const { data: rawRegs, error } = await supabase
    .from("registrations")
    .select(
      `id, status, distance, amount, created_at, waiver_pdf_url,
       events ( id, title, slug, date, location )`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[my-events] query failed:", error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  const registrations = ((rawRegs ?? []) as RegWithEvent[]).sort((a, b) => {
    const aDate = a.events?.date ? new Date(a.events.date).getTime() : 0;
    const bDate = b.events?.date ? new Date(b.events.date).getTime() : 0;
    if (bDate !== aDate) return bDate - aDate;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const registered = registrations.filter(
    (r) => r.status === "paid" || r.status === "free"
  );
  const inProgress = registrations.filter((r) => r.status === "pending");
  const past = registrations.filter(
    (r) => r.status === "refunded" || r.status === "cancelled"
  );

  const total = registrations.length;

  return (
    <>
      <Hero
        title="My Events"
        subtitle={
          total === 0
            ? "No registrations yet"
            : `${total} registration${total === 1 ? "" : "s"}`
        }
      />

      <section className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        {total === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Ticket className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="text-base font-medium">No registrations yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Find an upcoming event and register to get started.
              </p>
            </div>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        ) : (
          <>
            <Section title="Registered" regs={registered} />
            <Section title="In Progress" regs={inProgress} />
            <Section title="Refunded / Cancelled" regs={past} />
          </>
        )}
      </section>
    </>
  );
}
