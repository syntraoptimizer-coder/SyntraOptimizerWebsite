"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight, Mail, ShieldCheck, Sparkles, Check, LogOut,
  Loader2, Sun, Moon, Zap, Monitor, ExternalLink, ChevronRight,
  ChevronDown, Menu, X, ArrowUpRight,
} from "lucide-react";
import { getAvatarUrl } from '@/lib/avatar';
import { getSupabase } from "@/lib/supabase";
import { product } from "@/lib/product";
import { startCheckout } from "@/lib/checkout";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.6a4.8 4.8 0 0 1-2.1 3.2v2.8h3.6c2.1-2 3.3-4.7 3.3-8.1Z"/>
      <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 7-2.5l-3.5-2.8c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.2H2.6v2.9A10.5 10.5 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.2 13.5a6.4 6.4 0 0 1 0-4V6.6H2.6a10.5 10.5 0 0 0 0 9.8l3.6-2.9Z"/>
      <path fill="#EA4335" d="M12 5.3c1.5 0 2.8.5 3.8 1.5L19 3.6A10.1 10.1 0 0 0 12 1 10.5 10.5 0 0 0 2.6 6.6l3.6 2.9C7 7.1 9.3 5.3 12 5.3Z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M19.7 5.3a18 18 0 0 0-4.4-1.4l-.5 1a16.8 16.8 0 0 0-5.6 0l-.5-1a18 18 0 0 0-4.4 1.4C1.5 9.5.7 13.5 1.1 17.4a17.7 17.7 0 0 0 5.4 2.7l1.1-1.8-1.6-.8.4-.3a12.7 12.7 0 0 0 11.2 0l.4.3-1.6.8 1.1 1.8a17.7 17.7 0 0 0 5.4-2.7c.5-4.5-.8-8.4-3.2-12.1ZM8.5 14.9c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function LoginPage() {
  const [light, setLight] = useState(true);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"Loading…" | "Free" | "Premium">("Loading…");
  const [avatarErr, setAvatarErr] = useState(false);

  const sb = getSupabase();

  useEffect(() => { try { setLight(localStorage.getItem("syntra-theme") !== "dark"); } catch {} }, []);
  useEffect(() => {
    if (light) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try { localStorage.setItem("syntra-theme", light ? "light" : "dark"); } catch {}
  }, [light]);
  useEffect(() => {
    const onScroll = () => { const y = window.scrollY; setScrolled(y > 28); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!sb) return;
    let active = true;
    sb.auth.getUser().then(({ data }) => { if (active) setUser(data.user); });
    const { data } = sb.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [sb]);

  useEffect(() => {
    if (!sb || !user) { if (!user) setPlan("Free"); return; }
    let active = true;
    setPlan("Loading…");
    async function checkPlan() {
      try {
        const { data, error } = await sb!.from("licenses").select("plan").eq("user_id", user!.id).maybeSingle();
        if (!active) return;
        if (!error && data?.plan === "premium") { setPlan("Premium"); return; }
        const metaPlan = user!.app_metadata?.plan; // server-only, unlike user-editable user_metadata
        if (metaPlan === "premium") { setPlan("Premium"); return; }
        setPlan("Free");
      } catch { if (active) setPlan("Free"); }
    }
    void checkPlan();
    return () => { active = false; };
  }, [user, sb]);

  async function handleOAuth(provider: "google" | "discord" | "azure" | "github") {
    if (!sb) return;
    setOauthLoading(provider);
    setMessage("");
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setMessage(`Unable to connect: ${err instanceof Error ? err.message : "Authentication failed"}`);
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
        options: { emailRedirectTo: `${window.location.origin}/account` },
      });
      if (error) throw error;
      setMessage("✓ Un lien de connexion sécurisé a été envoyé à votre adresse email.");
    } catch {
      setMessage("Impossible d'envoyer le lien. Vérifiez votre adresse email.");
    } finally { setBusy(false); }
  }

  const meta = user?.user_metadata || {};
  const displayName = String(meta.full_name || meta.name || user?.email?.split("@")[0] || "Syntra Member");
  const avatarUrl = getAvatarUrl(user);
  const userInitial = displayName.trim().charAt(0).toUpperCase() || "S";

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div id="top" className="site-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: 0 }}>

        {/* ── Navigation identique à la homepage ── */}
        <header className={scrolled ? "navigation scrolled" : "navigation"}>
          <a href="/" className="brand" aria-label="Syntra Optimizer home">
            <img src="/assets/syntra-logo.png" width="30" height="30" alt="" />
            <span>Syntra<span className="brand-sub"> Optimizer</span></span>
          </a>

          <nav aria-label="Main navigation" className={menu ? "nav-links open" : "nav-links"}>
            {(["Features", "Safety", "For you", "Pricing"] as const).map((label) => (
              <a key={label} href={`/#${label.toLowerCase().replace(" ", "")}`} onClick={() => setMenu(false)}>
                {label}{["Features", "For you"].includes(label) && <ChevronDown size={12} />}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            {user ? (
              <a href="/account" className="nav-user-chip" aria-label="Open account details">
                <span className="nav-user-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : userInitial}
                </span>
                <span className="nav-user-name">{displayName.split(" ")[0]}</span>
                <span className={`nav-plan-pill ${plan === "Premium" ? "premium" : "free"}`}>
                  {plan === "Premium" ? "✦ Premium" : "Free"}
                </span>
              </a>
            ) : (
              <span className="nav-demo" style={{ color: "var(--blue)", fontWeight: 550 }}>Sign in</span>
            )}
            <button
              className="button primary compact"
              onClick={() => { if (product.downloadUrl) window.location.assign(product.downloadUrl); }}
            >
              Get Syntra <ArrowUpRight size={14} />
            </button>
            <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <main id="main" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 20px 100px" }}>
          <div style={{ width: "100%", maxWidth: "980px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "52px", alignItems: "center" }}>

            {/* Left: pitch */}
            <div>
              <span className="eyebrow">
                <Zap size={13} /> CONNECT YOUR ACCOUNT <ChevronRight size={13} />
              </span>
              <h1 style={{ fontSize: "clamp(34px, 4.2vw, 56px)", lineHeight: 1.08, letterSpacing: "-2.2px", fontWeight: 470, margin: "20px 0 18px" }}>
                Your PC.<br />
                <span style={{ color: "var(--blue)" }}>Your space.</span><br />
                Made personal.
              </h1>
              <p style={{ fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.7, marginBottom: 36, maxWidth: 420 }}>
                Connect your account to activate your <strong>Free</strong> or <strong>Premium</strong> license in the Syntra Optimizer desktop app on your PC.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { icon: <Monitor size={15} />, title: "Desktop App Sync", desc: "Sign in once and your license activates automatically on your PC (one PC per account)." },
                  { icon: <Sparkles size={15} style={{ color: "#f59e0b" }} />, title: "Free & Premium Tiers", desc: "View your perks, unlock advanced gaming tweaks, and manage license keys." },
                  { icon: <ShieldCheck size={15} />, title: "Safe & Encrypted", desc: "Backed by Supabase auth. No password to memorize, ever." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--secondary)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--blue)", flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, fontWeight: 560 }}>{title}</strong>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: auth card */}
            <div className="price-card" style={{ boxShadow: "0 24px 60px -28px rgba(20,26,33,.22)" }}>
              {user ? (
                <div>
                  <div className="account-user-card" style={{ marginBottom: 20 }}>
                    <div className="account-avatar-wrapper">
                      {avatarUrl && !avatarErr
                        ? <img src={avatarUrl} alt={displayName} className="account-avatar-img" referrerPolicy="no-referrer" onError={() => setAvatarErr(true)} />
                        : <span className="account-avatar-initials">{userInitial}</span>}
                    </div>
                    <div className="account-user-info">
                      <h4>{displayName}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>

                  <div className={`plan-status-card ${plan === "Premium" ? "is-premium" : "is-free"}`} style={{ marginBottom: 18 }}>
                    <div className="plan-status-header">
                      <div>
                        <span className="plan-status-eyebrow">YOUR PLAN</span>
                        <div className="plan-status-title">
                          <span className={`plan-badge ${plan === "Premium" ? "plan-badge-premium" : "plan-badge-free"}`}>
                            {plan === "Premium" ? <><Sparkles size={11} /> Syntra Premium</> : <><ShieldCheck size={11} /> Syntra Free</>}
                          </span>
                        </div>
                      </div>
                    </div>
                    {plan === "Premium" ? (
                      <ul className="plan-perks-list">
                        {["All performance profiles (Gaming, Creator, Balanced)", "Deep system & registry cleanup", "Restore point generator", "One PC per account, transferable"].map(p => (
                          <li key={p}><Check size={13} /> {p}</li>
                        ))}
                      </ul>
                    ) : (
                      <div>
                        <ul className="plan-perks-list" style={{ marginBottom: 14 }}>
                          <li><Check size={13} /> Essential cleanup & system scan</li>
                          <li><Check size={13} /> Balanced everyday profile</li>
                          <li className="muted-perk">✕ Gaming mode & low-latency tweaks</li>
                        </ul>
                        <button
                          type="button"
                          className="button primary"
                          style={{ width: "100%", fontSize: 13 }}
                          onClick={async () => {
                            const problem = await startCheckout();
                            if (problem) setMessage(problem);
                          }}
                        >
                          <Sparkles size={14} /> Upgrade to Premium — $15 <ArrowRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <a href="/account" className="button secondary" style={{ flex: 1, fontSize: 13 }}>
                      Full Dashboard <ExternalLink size={13} />
                    </a>
                    <button
                      className="button"
                      style={{ fontSize: 13, padding: "8px 14px" }}
                      onClick={async () => { await sb!.auth.signOut(); setUser(null); setPlan("Free"); }}
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <img src="/assets/syntra-logo.png" width={40} height={40} alt="" style={{ borderRadius: 10, marginBottom: 12 }} />
                    <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.6px", margin: "0 0 6px" }}>Connect to Syntra</h2>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>Select a provider to link your account.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {([
                      { provider: "google" as const, icon: <GoogleIcon />, label: "Continue with Google" },
                      { provider: "discord" as const, icon: <DiscordIcon />, label: "Continue with Discord" },
                      { provider: "azure" as const, icon: <MicrosoftIcon />, label: "Continue with Microsoft" },
                      { provider: "github" as const, icon: <GithubIcon />, label: "Continue with GitHub" },
                    ]).map(({ provider, icon, label }) => (
                      <button
                        key={provider}
                        type="button"
                        className="oauth-button"
                        style={{ justifyContent: "flex-start", gap: 12, padding: "12px 16px", fontSize: 14, fontWeight: 540, width: "100%" }}
                        disabled={!!oauthLoading}
                        onClick={() => handleOAuth(provider)}
                      >
                        {oauthLoading === provider ? <Loader2 size={18} className="spin" /> : icon}
                        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                        <ArrowRight size={14} style={{ opacity: 0.4 }} />
                      </button>
                    ))}
                  </div>

                  <div className="oauth-divider"><span>or sign in with email</span></div>

                  <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    <label className="account-email-form" htmlFor="login-email">Email address</label>
                    <div className="email-field">
                      <Mail size={15} />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        maxLength={254}
                      />
                    </div>
                    <button type="submit" className="button secondary" style={{ width: "100%", fontSize: 13 }} disabled={busy || !!oauthLoading}>
                      {busy ? "Sending secure link…" : "Email me a sign-in link"} <ArrowRight size={14} />
                    </button>
                    <p className="small-note" style={{ textAlign: "center" }}>Password-free · New users are registered automatically.</p>
                  </form>
                </div>
              )}

              {message && <div className="account-message" style={{ marginTop: 16 }}>{message}</div>}
            </div>
          </div>
        </main>

        <footer>
          <a href="/" className="brand">
            <img src="/assets/syntra-logo.png" width={26} height={26} alt="" />
            <span>Syntra<span className="brand-sub"> Optimizer</span></span>
          </a>
          <span>© {new Date().getFullYear()} Syntra Optimizer</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </div>

      <button className="theme-toggle" onClick={() => setLight(!light)} aria-label={light ? "Switch to dark theme" : "Switch to light theme"}>
        {light ? <Moon size={19} /> : <Sun size={19} />}
      </button>
    </>
  );
}
