import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
          unit_amount: 5000, // $50.00 default — replace with event pricing logic
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
    },
    customer_email: user?.email || undefined,
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events`,
  });

  return NextResponse.json({ url: session.url });
}
