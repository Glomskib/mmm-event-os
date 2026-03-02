import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrice } from "@/lib/pricing";

export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json();
  const { event_id, distance, waiverAccepted, referralCode } = body;

  // Validate waiver
  if (!waiverAccepted) {
    return NextResponse.json(
      { error: "You must accept the waiver to register." },
      { status: 400 }
    );
  }

  if (!event_id || !distance) {
    return NextResponse.json(
      { error: "event_id and distance are required." },
      { status: 400 }
    );
  }

  // Look up the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, org_id, title, status")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (event.status !== "published") {
    return NextResponse.json(
      { error: "Event is not open for registration." },
      { status: 400 }
    );
  }

  // Get current user (optional — guest checkout allowed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Capture waiver metadata from request headers
  const waiverIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const waiverUserAgent = request.headers.get("user-agent") || "unknown";
  const waiverVersion = "v1";
  const waiverAcceptedAt = new Date().toISOString();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const price = getPrice(event.title, distance);

  // ── Free tier: skip Stripe, insert registration directly ──
  if (price === 0) {
    const admin = createAdminClient();
    const { error: regError } = await admin.from("registrations").insert({
      org_id: event.org_id,
      event_id: event.id,
      user_id: user?.id || null,
      distance,
      amount: 0,
      status: "free",
      referral_code: referralCode || null,
      email: user?.email || null,
      waiver_accepted: true,
      waiver_accepted_at: waiverAcceptedAt,
      waiver_ip: waiverIp,
      waiver_user_agent: waiverUserAgent,
      waiver_version: waiverVersion,
    });

    if (regError) {
      console.error("Failed to insert free registration:", regError);
      return NextResponse.json(
        { error: "Failed to create registration." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: `${appUrl}/success?free=true` });
  }

  // ── Paid tier: create Stripe checkout session ──
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${event.title} — ${distance}`,
            description: `Registration for ${event.title}`,
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      org_id: event.org_id,
      event_id: event.id,
      distance,
      referral_code: referralCode || "",
      user_id: user?.id || "",
      waiver_accepted: "true",
      waiver_accepted_at: waiverAcceptedAt,
      waiver_ip: waiverIp,
      waiver_user_agent: waiverUserAgent,
      waiver_version: waiverVersion,
    },
    customer_email: user?.email || undefined,
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events`,
  });

  return NextResponse.json({ url: session.url });
}
