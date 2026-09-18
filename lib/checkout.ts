import { getSupabase } from "./supabase";

/**
 * Starts the Premium checkout for the signed-in account. Sends the account's access token so the server knows who
 * is paying. On success the browser is sent to Stripe and this resolves to null; otherwise it resolves to a
 * message to show the visitor.
 */
export async function startCheckout(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Sign-in is not available right now.";
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return "Please sign in first.";
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as { url?: string; error?: string };
    if (json.url) {
      window.location.assign(json.url);
      return null;
    }
    return json.error || "Unable to start checkout. Please try again.";
  } catch {
    return "Network error. Please try again.";
  }
}
