import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { isUserId, setPlan } from "@/lib/supabase-server";

/**
 * POST /api/stripe/webhook — the ONLY place that grants or revokes Premium.
 *
 * Stripe calls this after a payment. The request is trusted only if its signature matches STRIPE_WEBHOOK_SECRET
 * (the `whsec_…` value Stripe shows for this endpoint), so nobody can forge an upgrade by posting to this URL.
 *
 *   checkout.session.completed / async_payment_succeeded  → Premium (only once the payment is really "paid")
 *   charge.refunded (fully) / charge.dispute.created      → back to Free
 *
 * Answers 5xx when something failed on our side (e.g. Supabase unreachable) so that Stripe retries the delivery.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  // The raw body is required to verify the signature: read it as text, do not parse it first.
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      secret,
      undefined,
      // Web Crypto instead of Node's crypto module, so this also runs on edge runtimes.
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await handle(stripe, event);
  } catch (err) {
    console.error(`[stripe/webhook] ${event.type} ${event.id} failed:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function handle(stripe: Stripe, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      // "completed" also fires for delayed payment methods whose money hasn't arrived yet.
      if (session.payment_status !== "paid") return;
      const userId = session.client_reference_id || session.metadata?.user_id;
      if (!isUserId(userId)) {
        console.warn(`[stripe/webhook] paid session ${session.id} has no valid account id; nothing to upgrade.`);
        return;
      }
      await setPlan(userId, "premium");
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (charge.refunded) await revokeFor(stripe, charge.payment_intent);
      return;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const charge = await stripe.charges.retrieve(
        typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id,
      );
      await revokeFor(stripe, charge.payment_intent);
      return;
    }
    default:
      return; // other events are ignored
  }
}

async function revokeFor(stripe: Stripe, paymentIntent: string | Stripe.PaymentIntent | null) {
  if (!paymentIntent) return;
  const id = typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
  const intent = await stripe.paymentIntents.retrieve(id);
  const userId = intent.metadata?.user_id;
  if (isUserId(userId)) await setPlan(userId, "free");
}
