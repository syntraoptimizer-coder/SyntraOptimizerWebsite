// The webhook endpoint already registered in the Stripe Dashboard points at /api/webhook/stripe. It shares the
// handler in /api/stripe/webhook, so either address works.
export { POST } from "../../stripe/webhook/route";
