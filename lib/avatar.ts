import type { User } from '@supabase/supabase-js';

/**
 * Profile photo of the provider the user signed in with most recently.
 *
 * Supabase links Google / Discord / GitHub / Microsoft logins that share an email into ONE user, and
 * `user_metadata` keeps the photo of whichever provider created the account. Reading it directly showed the
 * Discord picture after a Google sign-in. The per-provider data in `identities` is the reliable source.
 */
export function getAvatarUrl(user: User | null | undefined): string | undefined {
  if (!user) return undefined;
  const identities = [...(user.identities ?? [])].sort(
    (a, b) => Date.parse(b.last_sign_in_at ?? '') - Date.parse(a.last_sign_in_at ?? '') || 0,
  );
  const current = identities.find((identity) => identity.provider !== 'email');
  if (current) {
    const data = (current.identity_data ?? {}) as Record<string, unknown>;
    const url = data.avatar_url || data.picture;
    return typeof url === 'string' && url ? url : undefined;
  }
  const meta = user.user_metadata ?? {};
  return meta.avatar_url || meta.picture || undefined;
}
