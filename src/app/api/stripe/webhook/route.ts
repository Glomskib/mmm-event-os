import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaiverEmail, sendEmail, getFromAddress } from "@/lib/resend";
import { applyEarlyBonusForRegistration } from "@/lib/incentives";
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

      // ── Donation receipt ──────────────────────────────────────────
      if (meta.type === "donation") {
        const donorEmail = session.customer_details?.email;
        const amountCents = session.amount_total || 0;
        const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
        const donationDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (donorEmail) {
          try {
            await sendEmail(
              {
                from: getFromAddress(),
                to: donorEmail,
                subject: "Thank You for Your Donation — Making Miles Matter",
                html: `
                  <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
                    <h2>Thank You for Your Generous Donation!</h2>
                    <p>We received your donation of <strong>${amountFormatted}</strong> on ${donationDate}.</p>
                    <p>
                      Your support helps Making Miles Matter provide resources and
                      programming for families in Hancock County, Ohio. Every dollar
                      makes a difference — thank you for being part of our mission.
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

                    <p style="font-size: 13px; color: #555;">
                      <strong>Tax Deduction Notice</strong><br/>
                      Making Miles Matter INC is a 501(c)(3) nonprofit organization
                      (EIN available upon request). No goods or services were provided
                      in exchange for this contribution. This email may serve as your
                      receipt for tax purposes. Please consult your tax advisor for
                      details on deductibility.
                    </p>

                    <p style="font-size: 13px; color: #555;">
                      Questions? Contact us at
                      <a href="mailto:miles@makingmilesmatter.com">miles@makingmilesmatter.com</a>.
                    </p>

                    <br/>
                    <p>With gratitude,<br/>— The Making Miles Matter Team</p>
                  </div>
                `,
              },
              "donation-receipt"
            );
          } catch (emailErr) {
            console.error("Failed to send donation receipt email:", emailErr);
          }
        } else {
          console.warn(
            `Donation session ${session.id} has no customer email — skipping receipt`
          );
        }

        // Insert donation record into the database
        if (meta.org_id) {
          try {
            await supabase.from("donations" as never).insert({
              org_id: meta.org_id,
              stripe_session_id: session.id,
              stripe_payment_intent_id:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id || null,
              amount: amountCents,
              donor_email: donorEmail || null,
              donor_name: session.customer_details?.name || null,
            } as never);
          } catch (dbErr) {
            console.error("Failed to insert donation record:", dbErr);
          }
        }

        console.log(
          `Donation processed: ${amountFormatted}, session=${session.id}`
        );
        break;
      }

      // Prefer updating existing registration by registration_id (new flow).
      // Fall back to upsert by stripe_session_id for backward compatibility.
      if (meta.registration_id) {
        // Verify the registration exists and has waiver accepted
        const { data: existing } = await supabase
          .from("registrations")
          .select("id, waiver_accepted, status")
          .eq("id", meta.registration_id)
          .single();

        if (!existing) {
          console.error(
            `Registration ${meta.registration_id} not found for session ${session.id}`
          );
          return NextResponse.json(
            { error: "Registration not found" },
            { status: 500 }
          );
        }

        // Idempotency: if already paid, skip
        if (existing.status === "paid") {
          console.log(
            `Registration ${existing.id} already paid — skipping duplicate webhook`
          );
          break;
        }

        if (!existing.waiver_accepted) {
          console.error(
            `Registration ${existing.id} has waiver_accepted=false — refusing to mark paid`
          );
          return NextResponse.json(
            { error: "Cannot mark paid: waiver not accepted" },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from("registrations")
          .update({
            status: "paid",
            stripe_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            amount: session.amount_total || 0,
            email: session.customer_email || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Failed to update registration:", updateError);
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
          );
        }

        // Referral credit — only for paid registrations with amount > 0
        if (meta.referral_code && (session.amount_total || 0) > 0) {
          const { data: creditExists } = await supabase
            .from("referral_credits")
            .select("id")
            .eq("registration_id", existing.id)
            .limit(1);

          if (!creditExists || creditExists.length === 0) {
            await supabase.from("referral_credits").insert({
              org_id: meta.org_id,
              registration_id: existing.id,
              referral_code: meta.referral_code,
              amount: 500,
            });
          }
        }

        // Send waiver confirmation email
        try {
          const { data: fullReg } = await supabase
            .from("registrations")
            .select(
              "participant_name, participant_email, waiver_pdf_url, waiver_accepted_at, distance, event_id"
            )
            .eq("id", existing.id)
            .single();

          if (fullReg?.participant_email && fullReg?.waiver_pdf_url) {
            const { data: evt } = await supabase
              .from("events")
              .select("title")
              .eq("id", fullReg.event_id)
              .single();

            const { data: signedUrl } = await supabase.storage
              .from("waivers")
              .createSignedUrl(fullReg.waiver_pdf_url, 60 * 60 * 24 * 7);

            if (signedUrl?.signedUrl) {
              await sendWaiverEmail(fullReg.participant_email, {
                participantName: fullReg.participant_name || "Participant",
                eventTitle: evt?.title || "Event",
                distance: fullReg.distance,
                signedAt: fullReg.waiver_accepted_at || new Date().toISOString(),
                pdfUrl: signedUrl.signedUrl,
                registrationId: existing.id,
              });
            }
          }
        } catch (emailErr) {
          console.error("Failed to send waiver email (paid):", emailErr);
        }

        // Apply early-bird bonus (idempotent, fire-and-forget)
        applyEarlyBonusForRegistration(existing.id).catch((err) =>
          console.error("[webhook] applyEarlyBonus failed:", err)
        );

        console.log(
          `Registration updated to paid: ${existing.id}, session=${session.id}`
        );
      } else {
        // Legacy flow — upsert by stripe_session_id (no registration_id in metadata)
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
              waiver_accepted: meta.waiver_accepted === "true",
              waiver_accepted_at: meta.waiver_accepted_at || null,
              waiver_ip: meta.waiver_ip || null,
              waiver_user_agent: meta.waiver_user_agent || null,
              waiver_version: meta.waiver_version || null,
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

        // Referral credit — only for paid registrations (amount > 0)
        if (meta.referral_code && (session.amount_total || 0) > 0) {
          const { data: reg } = await supabase
            .from("registrations")
            .select("id")
            .eq("stripe_session_id", session.id)
            .single();

          if (reg) {
            const { data: existing } = await supabase
              .from("referral_credits")
              .select("id")
              .eq("registration_id", reg.id)
              .limit(1);

            if (!existing || existing.length === 0) {
              await supabase.from("referral_credits").insert({
                org_id: meta.org_id,
                registration_id: reg.id,
                referral_code: meta.referral_code,
                amount: 500,
              });
            }
          }
        }

        console.log(
          `Registration created (legacy): session=${session.id}, event=${meta.event_id}`
        );
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (!paymentIntentId) break;

      const { data: reg } = await supabase
        .from("registrations")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .single();

      if (reg) {
        await supabase
          .from("registrations")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("id", reg.id);

        await supabase
          .from("referral_credits")
          .update({ voided: true })
          .eq("registration_id", reg.id);

        console.log(`Registration refunded: ${reg.id}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
