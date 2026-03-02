import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { registration_id } = body;

  if (!registration_id) {
    return NextResponse.json(
      { error: "registration_id is required. Accept the waiver first." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Look up the pending registration and verify waiver acceptance
  const { data: reg, error: regError } = await supabase
    .from("registrations")
    .select(
      "id, org_id, event_id, distance, amount, status, waiver_accepted, referral_code, email, user_id"
    )
    .eq("id", registration_id)
    .single();

  if (regError || !reg) {
    return NextResponse.json(
      { error: "Registration not found." },
      { status: 404 }
    );
  }

  if (!reg.waiver_accepted) {
    return NextResponse.json(
      { error: "Waiver must be accepted before checkout." },
      { status: 400 }
    );
  }

  if (reg.status !== "pending") {
    return NextResponse.json(
      {
        error: `Registration is already ${reg.status}. Cannot proceed to checkout.`,
      },
      { status: 400 }
    );
  }

  if (reg.amount === 0) {
    return NextResponse.json(
      { error: "This is a free registration. No checkout required." },
      { status: 400 }
    );
  }

  // Look up event title for the line item
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", reg.event_id)
    .single();

  const eventTitle = event?.title || "Event Registration";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${eventTitle} — ${reg.distance}`,
            description: `Registration for ${eventTitle}`,
          },
          unit_amount: reg.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      registration_id: reg.id,
      org_id: reg.org_id,
      event_id: reg.event_id,
      distance: reg.distance,
      referral_code: reg.referral_code || "",
      user_id: reg.user_id || "",
    },
    customer_email: reg.email || undefined,
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events`,
  });

  // Store the stripe session ID on the registration
  await supabase
    .from("registrations")
    .update({ stripe_session_id: session.id })
    .eq("id", reg.id);

  return NextResponse.json({ url: session.url });
}
