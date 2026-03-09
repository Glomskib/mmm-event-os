import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json(
        { error: "Minimum donation is $1." },
        { status: 400 }
      );
    }

    if (amount > 99999900) {
      return NextResponse.json(
        { error: "Amount exceeds maximum." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      metadata: { type: "donation" },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Donation to Making Miles Matter",
              description:
                "501(c)(3) tax-deductible donation supporting families in Hancock County, Ohio.",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate`,
      submit_type: "donate",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[donate/checkout]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
