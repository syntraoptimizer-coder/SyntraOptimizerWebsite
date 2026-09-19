"use client";
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, ShieldCheck, Sparkles, Check, LogOut, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getAvatarUrl } from '@/lib/avatar';
import { getSupabase } from '@/lib/supabase';
import EmailPasswordForm from '@/components/EmailPasswordForm';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.6a4.8 4.8 0 0 1-2.1 3.2v2.8h3.6c2.1-2 3.3-4.7 3.3-8.1Z"/>
      <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 7-2.5l-3.5-2.8c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.2H2.6v2.9A10.5 10.5 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.2 13.5a6.4 6.4 0 0 1 0-4V6.6H2.6a10.5 10.5 0 0 0 0 9.8l3.6-2.9Z"/>
      <path fill="#EA4335" d="M12 5.3c1.5 0 2.8.5 3.8 1.5L19 3.6A10.1 10.1 0 0 0 12 1 10.5 10.5 0 0 0 2.6 6.6l3.6 2.9C7 7.1 9.3 5.3 12 5.3Z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
      <path d="M19.7 5.3a18 18 0 0 0-4.4-1.4l-.5 1a16.8 16.8 0 0 0-5.6 0l-.5-1a18 18 0 0 0-4.4 1.4C1.5 9.5.7 13.5 1.1 17.4a17.7 17.7 0 0 0 5.4 2.7l1.1-1.8-1.6-.8.4-.3a12.7 12.7 0 0 0 11.2 0l.4.3-1.6.8 1.1 1.8a17.7 17.7 0 0 0 5.4-2.7c.5-4.5-.8-8.4-3.2-12.1ZM8.5 14.9c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function Account({
  open,
  onOpenChange,
  onUpgrade,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpgrade?: () => void;
}) {
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<'Loading…' | 'Free' | 'Premium'>('Loading…');
  const [avatarErr, setAvatarErr] = useState(false);

  const sb = getSupabase();

  useEffect(() => {
    if (!sb) return;
    let active = true;
    sb.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [sb]);

  useEffect(() => {
    if (!sb || !user) return;
    let active = true;
    setPlan('Loading…');

    async function checkPlan() {
      try {
        const { data, error } = await sb!
          .from('licenses')
          .select('plan')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (!active) return;
        if (!error && data?.plan === 'premium') {
          setPlan('Premium');
          return;
        }
        const metaPlan = user!.app_metadata?.plan; // server-only, unlike user-editable user_metadata
        if (metaPlan === 'premium') {
          setPlan('Premium');
          return;
        }
        setPlan('Free');
      } catch {
        if (active) setPlan('Free');
      }
    }

    void checkPlan();

    return () => {
      active = false;
    };
  }, [user, sb]);

  async function handleOAuth(provider: 'google' | 'discord' | 'azure' | 'github') {
    if (!sb) return;
    setOauthLoading(provider);
    setMessage('');
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setMessage(`Unable to connect with ${provider}: ${msg}`);
      setOauthLoading(null);
    }
  }

  const meta = user?.user_metadata || {};
  const displayName = String(meta.full_name || meta.name || user?.email?.split('@')[0] || 'Syntra Member');
  const avatarUrl = getAvatarUrl(user);
  const initial = displayName.trim().charAt(0).toUpperCase() || 'S';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="download-dialog account-dialog">
        <div className="account-dialog-header">
          <img src="/assets/syntra-logo.png" width="44" height="44" alt="Syntra" />
          <div>
            <DialogTitle className="dialog-title">
              {user ? 'Your Syntra Account' : 'Connect to Syntra'}
            </DialogTitle>
            <DialogDescription>
              {user
                ? 'Linked with your desktop app & cloud settings.'
                : 'Sign in to access your desktop license and sync preferences.'}
            </DialogDescription>
          </div>
        </div>

        {user ? (
          <div className="account-profile-view">
            {/* User card */}
            <div className="account-user-card">
              <div className="account-avatar-wrapper">
                {avatarUrl && !avatarErr ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="account-avatar-img"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarErr(true)}
                  />
                ) : (
                  <div className="account-avatar-initials">{initial}</div>
                )}
              </div>
              <div className="account-user-info">
                <h4>{displayName}</h4>
                <p>{user.email}</p>
                <div className="account-linked-providers">
                  <span>Linked via</span>
                  <strong>
                    {user.app_metadata?.provider
                      ? user.app_metadata.provider.charAt(0).toUpperCase() + user.app_metadata.provider.slice(1)
                      : 'Supabase'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Plan Tier Status */}
            <div className={`plan-status-card ${plan === 'Premium' ? 'is-premium' : 'is-free'}`}>
              <div className="plan-status-header">
                <div>
                  <span className="plan-status-eyebrow">YOUR CURRENT PLAN</span>
                  <div className="plan-status-title">
                    {plan === 'Premium' ? (
                      <>
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="plan-badge plan-badge-premium">Syntra Premium</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span className="plan-badge plan-badge-free">Syntra Free</span>
                      </>
                    )}
                  </div>
                </div>
                {plan === 'Free' && onUpgrade && (
                  <button
                    className="button primary compact"
                    onClick={() => {
                      onOpenChange(false);
                      onUpgrade();
                    }}
                  >
                    Upgrade <ArrowRight size={13} />
                  </button>
                )}
              </div>

              <div className="plan-status-details">
                {plan === 'Premium' ? (
                  <ul className="plan-perks-list">
                    <li><Check size={13} /> Full desktop app access with advanced tweaks</li>
                    <li><Check size={13} /> Dedicated Gaming & Focus performance profiles</li>
                    <li><Check size={13} /> Deep system cleanup & restore points</li>
                    <li><Check size={13} /> License active for all your personal devices</li>
                  </ul>
                ) : (
                  <ul className="plan-perks-list">
                    <li><Check size={13} /> Basic system cleanup & overview</li>
                    <li><Check size={13} /> Balanced performance profile</li>
                    <li className="muted-perk">✕ Gaming mode & custom tweaks (Premium only)</li>
                  </ul>
                )}
              </div>
            </div>

            <button
              className="button secondary account-signout-btn"
              onClick={async () => {
                const { error } = await sb!.auth.signOut();
                if (error) setMessage('Could not sign out. Please try again.');
                else {
                  setUser(null);
                  setPlan('Free');
                }
              }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        ) : (
          <div className="account-auth-view">
            {!sb ? (
              <div className="account-unavailable">
                <ShieldCheck size={23} />
                <h4>Accounts service unavailable</h4>
                <p>Please check your Supabase configuration in environment variables.</p>
              </div>
            ) : (
              <>
                {/* OAuth Social Buttons */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  margin: "18px 0"
                }}>
                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth('google')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: oauthLoading ? "wait" : "pointer"
                    }}
                  >
                    {oauthLoading === 'google' ? <Loader2 size={18} className="spin" /> : <GoogleIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with Google</span>
                    <ArrowRight size={14} style={{ opacity: 0.4 }} />
                  </button>

                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth('discord')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: oauthLoading ? "wait" : "pointer"
                    }}
                  >
                    {oauthLoading === 'discord' ? <Loader2 size={18} className="spin" /> : <DiscordIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with Discord</span>
                    <ArrowRight size={14} style={{ opacity: 0.4 }} />
                  </button>

                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth('azure')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: oauthLoading ? "wait" : "pointer"
                    }}
                  >
                    {oauthLoading === 'azure' ? <Loader2 size={18} className="spin" /> : <MicrosoftIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with Microsoft</span>
                    <ArrowRight size={14} style={{ opacity: 0.4 }} />
                  </button>

                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth('github')}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: oauthLoading ? "wait" : "pointer"
                    }}
                  >
                    {oauthLoading === 'github' ? <Loader2 size={18} className="spin" /> : <GithubIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with GitHub</span>
                    <ArrowRight size={14} style={{ opacity: 0.4 }} />
                  </button>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  fontSize: "11px",
                  margin: "14px 0"
                }}>
                  <span style={{ flex: 1, borderBottom: "1px solid var(--border)" }} />
                  <span style={{ padding: "0 10px" }}>or use your email</span>
                  <span style={{ flex: 1, borderBottom: "1px solid var(--border)" }} />
                </div>

                <EmailPasswordForm sb={sb!} onDone={() => onOpenChange(false)} />
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <a
                    href="/login"
                    onClick={() => onOpenChange(false)}
                    style={{ fontSize: "12px", color: "var(--blue)", textDecoration: "none" }}
                  >
                    Open dedicated full page →
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {message && (
          <p role="status" className="account-message">
            {message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

