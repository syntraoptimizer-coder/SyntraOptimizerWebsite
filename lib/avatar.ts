import type { User } from '@supabase/supabase-js';

/**
 * Profile photo of the provider that created the account.
 *
 * Supabase links Google / Discord / GitHub / Microsoft logins that share an email into ONE user, and
 * `user_metadata` follows whichever provider signed in last (linking Discord replaced the Google picture).
 * The photo always comes from the first linked identity, so it never changes when another account is
 * linked or used to sign in.
 */
export function getAvatarUrl(user: User | null | undefined): string | undefined {
  if (!user) return undefined;
  const meta = user.user_metadata ?? {};
  const primary = [...(user.identities ?? [])]
    .filter((identity) => identity.provider !== 'email')
    .sort((a, b) => Date.parse(a.created_at ?? '') - Date.parse(b.created_at ?? '') || 0)[0];
  if (primary) {
    const data = (primary.identity_data ?? {}) as Record<string, unknown>;
    // The desktop app stores the Google photo under its own key when Supabase didn't copy it.
    const url =
      data.avatar_url || data.picture || (primary.provider === 'google' ? meta.syntra_google_avatar_url : undefined);
    return typeof url === 'string' && url ? url : undefined;
  }
  return meta.avatar_url || meta.picture || undefined;
}
