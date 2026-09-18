"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Mail, ShieldCheck, Sparkles, Check, LogOut, Loader2, Sun, Moon, ArrowLeft, Monitor, Zap, ExternalLink } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.6a4.8 4.8 0 0 1-2.1 3.2v2.8h3.6c2.1-2 3.3-4.7 3.3-8.1Z"/>
      <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 7-2.5l-3.5-2.8c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.2H2.6v2.9A10.5 10.5 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.2 13.5a6.4 6.4 0 0 1 0-4V6.6H2.6a10.5 10.5 0 0 0 0 9.8l3.6-2.9Z"/>
      <path fill="#EA4335" d="M12 5.3c1.5 0 2.8.5 3.8 1.5L19 3.6A10.1 10.1 0 0 0 12 1 10.5 10.5 0 0 0 2.6 6.6l3.6 2.9C7 7.1 9.3 5.3 12 5.3Z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M19.7 5.3a18 18 0 0 0-4.4-1.4l-.5 1a16.8 16.8 0 0 0-5.6 0l-.5-1a18 18 0 0 0-4.4 1.4C1.5 9.5.7 13.5 1.1 17.4a17.7 17.7 0 0 0 5.4 2.7l1.1-1.8-1.6-.8.4-.3a12.7 12.7 0 0 0 11.2 0l.4.3-1.6.8 1.1 1.8a17.7 17.7 0 0 0 5.4-2.7c.5-4.5-.8-8.4-3.2-12.1ZM8.5 14.9c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function LoginPage() {
  const [light, setLight] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"Loading…" | "Free" | "Premium">("Loading…");
  const [avatarErr, setAvatarErr] = useState(false);

  const sb = getSupabase();

  useEffect(() => {
    try {
      setLight(localStorage.getItem("syntra-theme") !== "dark");
    } catch {}
  }, []);

  useEffect(() => {
    if (light) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try {
      localStorage.setItem("syntra-theme", light ? "light" : "dark");
    } catch {}
  }, [light]);

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
    setPlan("Loading…");

    async function checkPlan() {
      try {
        const { data, error } = await sb!
          .from("licenses")
          .select("plan")
          .eq("user_id", user!.id)
          .maybeSingle();

        if (!active) return;
        if (!error && data?.plan === "premium") {
          setPlan("Premium");
          return;
        }
        const metaPlan = user!.user_metadata?.plan || user!.app_metadata?.plan;
        if (metaPlan === "premium") {
          setPlan("Premium");
          return;
        }
        setPlan("Free");
      } catch {
        if (active) setPlan("Free");
      }
    }

    void checkPlan();

    return () => {
      active = false;
    };
  }, [user, sb]);

  async function handleOAuth(provider: "google" | "discord" | "azure" | "github") {
    if (!sb) return;
    setOauthLoading(provider);
    setMessage("");
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setMessage(`Unable to connect with ${provider}: ${msg}`);
      setOauthLoading(null);
    }
  }

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw error;
      setMessage("A secure login link was sent to your email. Check your inbox!");
    } catch {
      setMessage("Could not send sign-in link. Please verify your email.");
    } finally {
      setBusy(false);
    }
  }

  const meta = user?.user_metadata || {};
  const displayName = String(meta.full_name || meta.name || user?.email?.split("@")[0] || "Syntra Member");
  const avatarUrl = meta.avatar_url || meta.picture;
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "Geist, Arial, sans-serif"
    }}>
      {/* Top Navbar */}
      <header style={{
        height: "72px",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--card) 90%, transparent)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 30
      }}>
        <a href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 650,
          fontSize: "18px",
          textDecoration: "none",
          color: "var(--foreground)"
        }}>
          <img src="/assets/syntra-logo.png" width="32" height="32" alt="Syntra" style={{ borderRadius: "8px" }} />
          <span>Syntra <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>Optimizer</span></span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--muted-foreground)",
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--card)"
          }}>
            <ArrowLeft size={14} /> Back to Website
          </a>

          <button
            onClick={() => setLight(!light)}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--muted-foreground)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
            aria-label="Toggle theme"
          >
            {light ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "1040px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "40px",
          alignItems: "center"
        }}>
          {/* Left Column: Brand Story & Sync benefits */}
          <div style={{ padding: "10px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              background: "var(--secondary)",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--blue)",
              letterSpacing: "0.5px",
              marginBottom: "20px"
            }}>
              <Zap size={13} /> SYNTHESIZE PEAK PC PERFORMANCE
            </div>

            <h1 style={{
              fontSize: "clamp(32px, 3.8vw, 48px)",
              lineHeight: 1.15,
              fontWeight: 550,
              letterSpacing: "-1.5px",
              margin: "0 0 18px 0"
            }}>
              Your PC. Your Space.<br />
              <span style={{ color: "var(--blue)" }}>Made personal.</span>
            </h1>

            <p style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: "var(--muted-foreground)",
              marginBottom: "32px",
              maxWidth: "460px"
            }}>
              Connect your account to synchronize your <strong>Free</strong> or <strong>Premium</strong> license with the Syntra Optimizer desktop application on all your devices.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--blue)",
                  flexShrink: 0
                }}>
                  <Monitor size={15} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", fontWeight: 550 }}>Desktop App Sync</strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted-foreground)" }}>
                    Signing in with Google, Discord, Microsoft, or GitHub automatically activates your license in the desktop app.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                  color: "#f59e0b",
                  flexShrink: 0
                }}>
                  <Sparkles size={15} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", fontWeight: 550 }}>Free & Premium Tiers</strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted-foreground)" }}>
                    View your membership perks, unlock advanced gaming tweaks, and manage license keys.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--blue)",
                  flexShrink: 0
                }}>
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", fontWeight: 550 }}>Safe & Encrypted</strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--muted-foreground)" }}>
                    Backed by Supabase authentication. No password to memorize.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Card Container */}
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "36px",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.18)"
          }}>
            {user ? (
              /* Authenticated view */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                  <div style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid var(--border)",
                    background: "var(--muted)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}>
                    {avatarUrl && !avatarErr ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarErr(true)}
                      />
                    ) : (
                      <span style={{ fontSize: "20px", fontWeight: 650, color: "var(--blue)" }}>{initial}</span>
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "19px", fontWeight: 600, margin: 0 }}>{displayName}</h2>
                    <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "2px 0 0 0" }}>{user.email}</p>
                  </div>
                </div>

                {/* Plan status card */}
                <div style={{
                  borderRadius: "14px",
                  padding: "20px",
                  border: plan === "Premium" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--border)",
                  background: plan === "Premium"
                    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(63, 111, 224, 0.12))"
                    : "var(--secondary)",
                  marginBottom: "24px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "var(--muted-foreground)" }}>YOUR PLAN</span>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 650,
                      background: plan === "Premium" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "var(--card)",
                      color: plan === "Premium" ? "#ffffff" : "var(--foreground)",
                      border: plan === "Premium" ? "none" : "1px solid var(--border)"
                    }}>
                      {plan === "Premium" ? <><Sparkles size={13} /> Syntra Premium</> : <><ShieldCheck size={13} /> Syntra Free</>}
                    </span>
                  </div>

                  {plan === "Premium" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--foreground)" }}>
                        <Check size={14} style={{ color: "#f59e0b" }} /> Full desktop suite with all low-latency tweaks
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--foreground)" }}>
                        <Check size={14} style={{ color: "#f59e0b" }} /> Dedicated Gaming & Focus performance profiles
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--foreground)" }}>
                        <Check size={14} style={{ color: "#f59e0b" }} /> Deep system & registry cleanup with restore points
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--foreground)" }}>
                        <Check size={14} style={{ color: "#f59e0b" }} /> Active license linked to your account
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "var(--blue)" }} /> Essential system cleanup & overview
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "var(--blue)" }} /> Balanced everyday performance profile
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted-foreground)" }}>
                          ✕ Gaming mode & custom tweaks (Premium only)
                        </div>
                      </div>

                      <a
                        href="/#pricing"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "10px",
                          borderRadius: "10px",
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                          fontWeight: 550,
                          fontSize: "13px",
                          textDecoration: "none"
                        }}
                      >
                        Upgrade to Premium ($15) <ArrowRight size={14} />
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <a
                    href="/account"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--secondary)",
                      color: "var(--foreground)",
                      fontWeight: 550,
                      fontSize: "13px",
                      textDecoration: "none"
                    }}
                  >
                    View Full Account <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={async () => {
                      await sb!.auth.signOut();
                      setUser(null);
                      setPlan("Free");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 18px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              /* Unauthenticated sign-in view */
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-0.5px", margin: "0 0 6px 0" }}>
                    Connect to Syntra
                  </h2>
                  <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: 0 }}>
                    Select a sign-in provider to link your account.
                  </p>
                </div>

                {/* 4 Dedicated OAuth Buttons */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "11px",
                  marginBottom: "24px"
                }}>
                  {/* Google */}
                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth("google")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      width: "100%",
                      padding: "13px 18px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: 550,
                      cursor: oauthLoading ? "wait" : "pointer",
                      transition: "background 0.2s, border-color 0.2s, transform 0.15s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    {oauthLoading === "google" ? <Loader2 size={20} className="spin" /> : <GoogleIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with Google</span>
                    <ArrowRight size={15} style={{ opacity: 0.5 }} />
                  </button>

                  {/* Discord */}
                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth("discord")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      width: "100%",
                      padding: "13px 18px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: 550,
                      cursor: oauthLoading ? "wait" : "pointer",
                      transition: "background 0.2s, border-color 0.2s, transform 0.15s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    {oauthLoading === "discord" ? <Loader2 size={20} className="spin" /> : <DiscordIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with Discord</span>
                    <ArrowRight size={15} style={{ opacity: 0.5 }} />
                  </button>

                  {/* Microsoft */}
                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth("azure")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      width: "100%",
                      padding: "13px 18px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: 550,
                      cursor: oauthLoading ? "wait" : "pointer",
                      transition: "background 0.2s, border-color 0.2s, transform 0.15s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    {oauthLoading === "azure" ? <Loader2 size={20} className="spin" /> : <MicrosoftIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with Microsoft</span>
                    <ArrowRight size={15} style={{ opacity: 0.5 }} />
                  </button>

                  {/* GitHub */}
                  <button
                    type="button"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuth("github")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      width: "100%",
                      padding: "13px 18px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      fontWeight: 550,
                      cursor: oauthLoading ? "wait" : "pointer",
                      transition: "background 0.2s, border-color 0.2s, transform 0.15s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    {oauthLoading === "github" ? <Loader2 size={20} className="spin" /> : <GithubIcon />}
                    <span style={{ flex: 1, textAlign: "left" }}>Continue with GitHub</span>
                    <ArrowRight size={15} style={{ opacity: 0.5 }} />
                  </button>
                </div>

                {/* Divider */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  fontSize: "12px",
                  margin: "20px 0"
                }}>
                  <span style={{ flex: 1, borderBottom: "1px solid var(--border)" }} />
                  <span style={{ padding: "0 12px", letterSpacing: "0.3px" }}>or sign in with email</span>
                  <span style={{ flex: 1, borderBottom: "1px solid var(--border)" }} />
                </div>

                {/* Email Form */}
                <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label htmlFor="login-email" style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--muted-foreground)", marginBottom: "6px" }}>
                      Email address
                    </label>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "11px 14px",
                      background: "var(--background)"
                    }}>
                      <Mail size={16} style={{ color: "var(--muted-foreground)" }} />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        maxLength={254}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--foreground)",
                          fontSize: "14px",
                          outline: "none",
                          width: "100%"
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !!oauthLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--secondary)",
                      color: "var(--foreground)",
                      fontWeight: 550,
                      fontSize: "14px",
                      cursor: busy ? "wait" : "pointer",
                      marginTop: "4px"
                    }}
                  >
                    {busy ? "Sending secure link…" : "Email me a sign-in link"}
                    <ArrowRight size={14} />
                  </button>

                  <p style={{ textAlign: "center", fontSize: "11px", color: "var(--muted-foreground)", margin: "8px 0 0 0" }}>
                    Password-free. New users are registered automatically.
                  </p>
                </form>
              </div>
            )}

            {message && (
              <div style={{
                marginTop: "18px",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid var(--blue)",
                background: "color-mix(in srgb, var(--blue) 10%, transparent)",
                color: "var(--blue)",
                fontSize: "13px"
              }}>
                {message}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "24px 32px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--muted-foreground)",
        borderTop: "1px solid var(--border)"
      }}>
        © {new Date().getFullYear()} Syntra Optimizer. Secure account access.
      </footer>
    </div>
  );
}
