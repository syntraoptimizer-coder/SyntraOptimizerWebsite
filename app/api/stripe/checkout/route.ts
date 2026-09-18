import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for the Premium upgrade ($15).
 * Returns { url } to redirect the client to Stripe's hosted payment page.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY          — your Stripe secret key (sk_live_... or sk_test_...)
 *   NEXT_PUBLIC_APP_URL        — your site URL (e.g. https://syntraoptimizer.com)
 *                                Falls back to the request origin if not set.
 */
export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    req.headers.get("origin") ||
    "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 1500, // $15.00
            product_data: {
              name: "Syntra Optimizer Premium",
              description: "One-time license — all performance profiles, gaming mode, deep cleanup & more.",
              images: [`${origin}/assets/syntra-logo.png`],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/account?upgraded=1`,
      cancel_url: `${origin}/account`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
