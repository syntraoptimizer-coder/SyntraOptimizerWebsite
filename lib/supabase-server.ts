import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase helpers (route handlers). Never import this file from a client component: the service-role
 * key it reads bypasses row-level security.
 */

export type Plan = "free" | "premium";

/** A client acting as the caller: uses the public key plus the caller's own access token, so RLS still applies. */
export function supabaseForToken(token: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUserId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

/**
 * Sets an account's plan in both places it is read from:
 *  - public.licenses.plan            (the website)
 *  - auth user app_metadata.plan     (the desktop app; app_metadata can only be written from the server)
 * Throws on any failure so the webhook answers 5xx and Stripe retries.
 */
export async function setPlan(userId: string, plan: Plan): Promise<void> {
  const admin = supabaseAdmin();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  const license = await admin.from("licenses").upsert({ user_id: userId, plan }, { onConflict: "user_id" });
  if (license.error) throw new Error(`licenses update failed: ${license.error.message}`);
  const auth = await admin.auth.admin.updateUserById(userId, { app_metadata: { plan } });
  if (auth.error) throw new Error(`app_metadata update failed: ${auth.error.message}`);
}
