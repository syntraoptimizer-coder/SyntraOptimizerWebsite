// Registers the Velyro webhook endpoint in Stripe and prints its signing secret.
//
//   node scripts/stripe-webhook.mjs https://your-domain.com
//
// Uses STRIPE_SECRET_KEY from the environment or from .env.production.local / .env.local. Run it ONCE, after the site
// (with /api/stripe/webhook) is deployed at that address. Stripe shows the signing secret (whsec_…) only when the
// endpoint is created: copy it straight into STRIPE_WEBHOOK_SECRET in the hosting environment.
import { existsSync } from "node:fs";
import Stripe from "stripe";

for (const file of [".env.production.local", ".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const site = (process.argv[2] || "").trim().replace(/\/+$/, "");
if (!/^https:\/\/[^\s/]+$/i.test(site)) {
  console.error("Usage: node scripts/stripe-webhook.mjs https://your-domain.com   (the public HTTPS address of the site)");
  process.exit(1);
}
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set.");
  process.exit(1);
}

const stripe = new Stripe(key);
const url = `${site}/api/stripe/webhook`;
const existing = await stripe.webhookEndpoints.list({ limit: 100 });
const already = existing.data.find((endpoint) => endpoint.url === url);
if (already) {
  console.log(`A webhook already points at ${url} (${already.id}, ${already.status}).`);
  console.log("Stripe only shows the signing secret at creation: reveal or roll it in Dashboard → Developers → Webhooks.");
  process.exit(0);
}

const endpoint = await stripe.webhookEndpoints.create({
  url,
  description: "Velyro Optimizer — grants Premium after payment",
  enabled_events: [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "charge.refunded",
    "charge.dispute.created",
  ],
});
console.log(`Webhook created: ${endpoint.id} → ${url} (${key.startsWith("sk_live") ? "live" : "test"} mode)`);
console.log("\nAdd this to the hosting environment (never commit it):");
console.log(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
