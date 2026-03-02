import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      // Upsert registration
      const { error: regError } = await supabase
        .from("registrations")
        .upsert(
          {
            org_id: meta.org_id,
            event_id: meta.event_id,
            user_id: meta.user_id || null,
            distance: meta.distance || "",
            stripe_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            amount: session.amount_total || 0,
            status: "paid",
            referral_code: meta.referral_code || null,
            email: session.customer_email || null,
          },
          { onConflict: "stripe_session_id" }
        );

      if (regError) {
        console.error("Failed to upsert registration:", regError);
        return NextResponse.json(
          { error: "Database error" },
          { status: 500 }
        );
      }

      // If there's a referral code, create a referral credit
      if (meta.referral_code) {
        // Look up the registration we just created
        const { data: reg } = await supabase
          .from("registrations")
          .select("id")
          .eq("stripe_session_id", session.id)
          .single();

        if (reg) {
          await supabase.from("referral_credits").insert({
            org_id: meta.org_id,
            registration_id: reg.id,
            referral_code: meta.referral_code,
            amount: 500, // $5.00 referral credit — adjust as needed
          });
        }
      }

      console.log(
        `Registration created: session=${session.id}, event=${meta.event_id}`
      );
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (!paymentIntentId) break;

      // Find registration by payment intent
      const { data: reg } = await supabase
        .from("registrations")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (reg) {
        // Update registration status
        await supabase
          .from("registrations")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("id", reg.id);

        // Void any referral credits for this registration
        await supabase
          .from("referral_credits")
          .update({ voided: true })
          .eq("registration_id", reg.id);

        console.log(`Registration refunded: ${reg.id}`);
      }
      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
