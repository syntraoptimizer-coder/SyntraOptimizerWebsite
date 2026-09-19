import Stripe from "stripe";

/** Server-side only: the secret key must never reach the browser or the desktop app. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

/** Where Stripe sends the customer back to. The configured production URL wins over the request's Origin. */
export function siteOrigin(req: Request): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  const origin = req.headers.get("origin");
  // A localhost value baked in from a local .env.local sent customers back to localhost after paying ("localhost
  // refused to connect"). Only trust a localhost URL when the request itself comes from localhost.
  const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
  if (configured && (!isLocal(configured) || (origin && isLocal(origin)))) return configured;
  return origin || configured || "http://localhost:3000";
}

/**
 * The Premium price. When STRIPE_PREMIUM_PRICE_ID is set (a price from the Stripe Dashboard, e.g. the EUR one) it is
 * used as is, so the amount and currency are managed in Stripe. Otherwise a $15 USD one-time price is created inline.
 */
function premiumLineItem(origin: string) {
  const priceId = (process.env.STRIPE_PREMIUM_PRICE_ID || "").trim();
  if (priceId) return { price: priceId, quantity: 1 };
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: 1500,
      product_data: {
        name: "Syntra Optimizer Premium",
        description: "One-time license — Performance Mode, the BIOS optimizer and every future Premium feature.",
        // Stripe only fetches product images over public HTTPS.
        ...(origin.startsWith("https://") ? { images: [`${origin}/assets/syntra-logo.png`] } : {}),
      },
    },
  };
}

/**
 * Premium is a one-time payment ($15). The Checkout Session is tied to the signed-in Syntra account through
 * `client_reference_id` and metadata: the webhook uses that to know WHICH account to upgrade after payment.
 */
export function createPremiumCheckoutSession(
  stripe: Stripe,
  { origin, userId, email }: { origin: string; userId: string; email?: string | null },
) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    ...(email ? { customer_email: email } : {}),
    metadata: { user_id: userId },
    payment_intent_data: { metadata: { user_id: userId } },
    line_items: [premiumLineItem(origin)],
    success_url: `${origin}/account?upgraded=1`,
    cancel_url: `${origin}/account`,
    allow_promotion_codes: true,
  });
}
