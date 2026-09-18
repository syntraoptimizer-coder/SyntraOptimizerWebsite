import { NextResponse } from "next/server";
import { createPremiumCheckoutSession, getStripe, siteOrigin } from "@/lib/stripe";
import { supabaseForToken } from "@/lib/supabase-server";

/**
 * POST /api/stripe/checkout   (Authorization: Bearer <Supabase access token>)
 *
 * Starts a Stripe Checkout for the Premium upgrade ($15, one time) for the SIGNED-IN account. The account is
 * identified from its access token, never from anything the page sends, and is attached to the session so the
 * webhook (/api/stripe/webhook) knows which account to upgrade once the payment succeeds.
 * Returns { url } to send the customer to Stripe's hosted payment page.
 *
 * Environment: STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL (falls back to the request origin), and the public Supabase pair.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") || "")?.[1];
  const supabase = token ? supabaseForToken(token) : null;
  if (!token || !supabase) {
    return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });
  }
  const { data, error: authError } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (authError || !user) {
    return NextResponse.json({ error: "Your session expired. Sign in again." }, { status: 401 });
  }

  // No second payment for an account that already has Premium.
  const { data: license } = await supabase.from("licenses").select("plan").eq("user_id", user.id).maybeSingle();
  if (license?.plan === "premium" || user.app_metadata?.plan === "premium") {
    return NextResponse.json({ error: "This account already has Premium." }, { status: 409 });
  }

  try {
    const session = await createPremiumCheckoutSession(stripe, {
      origin: siteOrigin(req),
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[stripe/checkout]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
  }
}
