import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { getFromAddress } from "@/lib/resend";

export const maxDuration = 60;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: "#dcfce7", text: "#166534" },
  moderate: { bg: "#fef9c3", text: "#854d0e" },
  hard: { bg: "#fee2e2", text: "#991b1b" },
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testMode = request.nextUrl.searchParams.get("test") === "true";

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://makingmilesmatter.org";

  // Get MMM org
  const { data: org } = await admin
    .from("orgs")
    .select("*")
    .eq("slug", "making-miles-matter")
    .single();

  if (!org) {
    return NextResponse.json({ error: "Org not found" }, { status: 500 });
  }

  // Query ride_occurrences for next 7 days
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const todayStr = today.toISOString().split("T")[0];
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  const { data: occurrences } = await admin
    .from("ride_occurrences")
    .select("*, ride_series(*)")
    .eq("org_id", org.id)
    .eq("cancelled", false)
    .gte("date", todayStr)
    .lte("date", nextWeekStr)
    .order("date", { ascending: true });

  const rideList = occurrences ?? [];

  if (rideList.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no rides" });
  }

  // Compute final values (occurrence overrides series)
  interface RideForEmail {
    date: string;
    dayName: string;
    time: string;
    title: string;
    difficulty: string;
    meet_location: string | null;
    notes: string | null;
    route_ridewithgps_url: string | null;
    route_strava_url: string | null;
    route_wahoo_url: string | null;
  }

  const rides: RideForEmail[] = rideList.map((occ) => {
    const series = occ.ride_series as {
      title: string;
      time: string;
      difficulty: string;
      day_of_week: number;
      meet_location: string | null;
      notes: string | null;
      route_ridewithgps_url: string | null;
      route_strava_url: string | null;
      route_wahoo_url: string | null;
    };

    const dateObj = new Date(occ.date + "T00:00:00");
    const dayName = DAY_NAMES[dateObj.getDay()];

    return {
      date: occ.date,
      dayName,
      time: series.time,
      title: series.title,
      difficulty: series.difficulty,
      meet_location: occ.meet_location ?? series.meet_location,
      notes: occ.notes ?? series.notes,
      route_ridewithgps_url:
        occ.route_ridewithgps_url ?? series.route_ridewithgps_url,
      route_strava_url: occ.route_strava_url ?? series.route_strava_url,
      route_wahoo_url: occ.route_wahoo_url ?? series.route_wahoo_url,
    };
  });

  // Group by date
  const grouped = new Map<string, RideForEmail[]>();
  for (const ride of rides) {
    const existing = grouped.get(ride.date) ?? [];
    existing.push(ride);
    grouped.set(ride.date, existing);
  }

  // Build HTML
  let ridesHtml = "";

  for (const [date, dateRides] of grouped) {
    const dateObj = new Date(date + "T00:00:00");
    const dateLabel = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    ridesHtml += `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 12px 0;font-size:18px;color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">
          ${dateLabel}
        </h3>`;

    for (const ride of dateRides) {
      const diffColors = DIFFICULTY_COLORS[ride.difficulty] ?? {
        bg: "#f3f4f6",
        text: "#374151",
      };

      // Format time (HH:MM -> readable)
      const [h, m] = ride.time.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      const timeStr = `${displayHour}:${m} ${ampm}`;

      // Route buttons
      let routeButtons = "";
      if (ride.route_ridewithgps_url) {
        routeButtons += `<a href="${ride.route_ridewithgps_url}" style="display:inline-block;margin-right:8px;margin-top:8px;padding:6px 12px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;">RideWithGPS</a>`;
      }
      if (ride.route_strava_url) {
        routeButtons += `<a href="${ride.route_strava_url}" style="display:inline-block;margin-right:8px;margin-top:8px;padding:6px 12px;background:#fc4c02;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;">Strava</a>`;
      }
      if (ride.route_wahoo_url) {
        routeButtons += `<a href="${ride.route_wahoo_url}" style="display:inline-block;margin-right:8px;margin-top:8px;padding:6px 12px;background:#00b2ff;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;">Wahoo</a>`;
      }

      ridesHtml += `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:16px;font-weight:600;color:#111827;">${ride.title}</span>
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:500;background:${diffColors.bg};color:${diffColors.text};">
              ${ride.difficulty}
            </span>
          </div>
          <p style="margin:0 0 4px 0;font-size:14px;color:#4b5563;">
            ${timeStr}
          </p>
          ${ride.meet_location ? `<p style="margin:0 0 4px 0;font-size:14px;color:#4b5563;">Meet: ${ride.meet_location}</p>` : ""}
          ${ride.notes ? `<p style="margin:0 0 4px 0;font-size:14px;color:#6b7280;font-style:italic;">${ride.notes}</p>` : ""}
          ${routeButtons ? `<div>${routeButtons}</div>` : ""}
        </div>`;
    }

    ridesHtml += `</div>`;
  }

  const emailHtml = `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:24px;">This Week's Rides</h1>
        <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Making Miles Matter</p>
      </div>

      <div style="padding:24px;background:#fff;">
        ${ridesHtml}

        <div style="margin-top:32px;text-align:center;border-top:1px solid #e5e7eb;padding-top:24px;">
          <a href="${siteUrl}/rides" style="display:inline-block;margin:0 8px 8px;padding:10px 20px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View All Rides</a>
          <a href="${siteUrl}/checkin" style="display:inline-block;margin:0 8px 8px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Check In</a>
          <a href="${siteUrl}/events" style="display:inline-block;margin:0 8px 8px;padding:10px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Invite a Friend</a>
        </div>
      </div>

      <div style="padding:16px 24px;background:#f3f4f6;text-align:center;border-radius:0 0 8px 8px;">
        <p style="margin:0;font-size:12px;color:#6b7280;">
          Making Miles Matter &middot; <a href="${siteUrl}" style="color:#2563eb;">makingmilesmatter.org</a>
        </p>
      </div>
    </div>
  `;

  // Fetch recipients
  let recipients: { email: string }[];

  if (testMode) {
    const testEmail = process.env.MMM_ADMIN_EMAIL;
    if (!testEmail) {
      return NextResponse.json(
        { error: "MMM_ADMIN_EMAIL not set" },
        { status: 500 }
      );
    }
    recipients = [{ email: testEmail }];
  } else {
    const { data: profiles } = await admin
      .from("profiles")
      .select("email")
      .eq("org_id", org.id)
      .eq("marketing_opt_in", true)
      .not("email", "is", null);

    recipients = profiles ?? [];
  }

  // Send emails sequentially
  let sent = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      await resend.emails.send({
        from: getFromAddress(),
        to: recipient.email,
        subject: "This Week's Ride Schedule — Making Miles Matter",
        html: emailHtml,
      });
      sent++;
    } catch (err) {
      errors.push(
        `${recipient.email}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    emailsSent: sent,
    emailErrors: errors.length,
    rideCount: rides.length,
  });
}
