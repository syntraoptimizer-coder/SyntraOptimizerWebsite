// The Supabase project URL and its PUBLISHABLE key. Both are public by design (they ship to every browser, and the
// desktop app carries the same pair); row-level security is what protects the data. Never put a service-role or
// secret key here.
//
// NEXT_PUBLIC_* variables are baked into the site at build time, so a variable missing from the hosting environment
// silently turns sign-in off. These defaults keep it working; an environment variable, when present, wins.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xjihrjciwkiwqmgtdqkc.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_P_lMxDwb6AITjLNndVFFyw_4vtiOdX2";
