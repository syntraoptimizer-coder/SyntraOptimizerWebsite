"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight, Check, Laptop, LogOut, Moon, ShieldCheck,
  Sparkles, Sun, ChevronRight, ChevronDown, Loader2, Menu, X, ArrowUpRight,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { product } from "@/lib/product";
import { startCheckout } from "@/lib/checkout";

export default function AccountPage() {
  const [light, setLight] = useState(true);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"Free" | "Premium">("Free");
  const [avatarErr, setAvatarErr] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [activating, setActivating] = useState(false);

  const sb = getSupabase();

  useEffect(() => { try { setLight(localStorage.getItem("syntra-theme") !== "dark"); } catch {} }, []);
  useEffect(() => {
    if (light) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try { localStorage.setItem("syntra-theme", light ? "light" : "dark"); } catch {}
  }, [light]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!sb) { setLoading(false); return; }
    let active = true;
    async function init() {
      const { data } = await sb!.auth.getUser();
      if (!active) return;
      setUser(data.user);
      if (data.user) {
        try {
          const { data: lData, error } = await sb!.from("licenses").select("plan").eq("user_id", data.user.id).maybeSingle();
          if (!active) return;
          if (!error && lData?.plan === "premium") { setPlan("Premium"); setLoading(false); return; }
          if (data.user.app_metadata?.plan === "premium") { setPlan("Premium"); setLoading(false); return; }
          setPlan("Free");
        } catch { setPlan("Free"); }
      }
      setLoading(false);
    }
    void init();
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  async function handleUpgrade() {
    setStripeLoading(true);
    const problem = await startCheckout();
    if (problem) {
      alert(problem);
      setStripeLoading(false);
    }
  }

  // ?checkout=1 (opened from the desktop app's Upgrade button): start the payment as soon as the account is known.
  // ?upgraded=1 (back from Stripe): the webhook grants Premium a moment after the payment, so wait for it.
  useEffect(() => {
    if (loading || !user || !sb || plan !== "Free") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "1") {
      window.history.replaceState(null, "", window.location.pathname);
      const start = setTimeout(() => void handleUpgrade(), 0);
      return () => clearTimeout(start);
    }
    if (params.get("upgraded") !== "1") return;
    const show = setTimeout(() => setActivating(true), 0);
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const { data } = await sb.auth.getUser();
      const fresh = data.user;
      let premium = fresh?.app_metadata?.plan === "premium";
      if (!premium && fresh) {
        const { data: license } = await sb.from("licenses").select("plan").eq("user_id", fresh.id).maybeSingle();
        premium = license?.plan === "premium";
      }
      if (premium) setPlan("Premium");
      if (premium || tries >= 20) {
        clearInterval(timer);
        setActivating(false);
      }
    }, 2000);
    return () => {
      clearTimeout(show);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, plan, sb]);

  const meta = user?.user_metadata || {};
  const displayName = String(meta.full_name || meta.name || user?.email?.split("@")[0] || "Syntra Member");
  const avatarUrl = meta.avatar_url || meta.picture;
  const userInitial = displayName.trim().charAt(0).toUpperCase() || "S";
  const provider = user?.app_metadata?.provider
    ? user.app_metadata.provider.charAt(0).toUpperCase() + user.app_metadata.provider.slice(1)
    : "Social Account";

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
              <span className="nav-user-chip" aria-label="Your account">
                <span className="nav-user-avatar">
                  {avatarUrl && !avatarErr
                    ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setAvatarErr(true)} />
                    : userInitial}
                </span>
                <span className="nav-user-name">{displayName.split(" ")[0]}</span>
                <span className={`nav-plan-pill ${plan === "Premium" ? "premium" : "free"}`}>
                  {plan === "Premium" ? "✦ Premium" : "Free"}
                </span>
              </span>
            ) : (
              <a href="/login" className="nav-demo">Sign in</a>
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
        <main id="main" style={{ flex: 1, padding: "56px 20px 100px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>

            {loading ? (
              <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <Loader2 size={28} className="spin" style={{ color: "var(--blue)", margin: "0 auto 14px", display: "block" }} />
                <p style={{ color: "var(--muted-foreground)", fontSize: 15 }}>Loading your account…</p>
              </div>
            ) : !user ? (
              <div style={{ textAlign: "center", padding: "60px 20px", maxWidth: 480, margin: "40px auto" }} className="price-card">
                <img src="/assets/syntra-logo.png" width={52} height={52} alt="" style={{ borderRadius: 12, marginBottom: 18 }} />
                <h2 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.7px", margin: "0 0 10px" }}>You&apos;re not signed in</h2>
                <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "0 0 28px" }}>
                  Connect your account via Google, Discord, Microsoft, or GitHub to manage your license and sync settings.
                </p>
                <a href="/login" className="button primary" style={{ fontSize: 14 }}>
                  Go to Sign In <ArrowRight size={15} />
                </a>
              </div>
            ) : (
              <div>
                {/* Page header */}
                <div style={{ marginBottom: 40 }}>
                  <span className="eyebrow">
                    <ChevronRight size={13} /> ACCOUNT OVERVIEW
                  </span>
                  <h1 style={{ fontSize: "clamp(30px, 3.8vw, 48px)", lineHeight: 1.08, letterSpacing: "-1.8px", fontWeight: 460, margin: "16px 0 8px" }}>
                    Welcome back, <span style={{ color: "var(--blue)" }}>{displayName.split(" ")[0]}</span>.
                  </h1>
                  <p style={{ fontSize: 15, color: "var(--muted-foreground)", margin: 0 }}>
                    Manage your Syntra Optimizer license and connected desktop devices.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 24 }}>
                  {/* Profile Card */}
                  <div className="price-card">
                    <p className="small-note" style={{ marginBottom: 14 }}>YOUR PROFILE</p>
                    <div className="account-user-card" style={{ marginBottom: 20 }}>
                      <div className="account-avatar-wrapper" style={{ width: 54, height: 54 }}>
                        {avatarUrl && !avatarErr
                          ? <img src={avatarUrl} alt={displayName} className="account-avatar-img" referrerPolicy="no-referrer" onError={() => setAvatarErr(true)} />
                          : <span className="account-avatar-initials" style={{ fontSize: 22 }}>{userInitial}</span>}
                      </div>
                      <div className="account-user-info">
                        <h4 style={{ fontSize: 16 }}>{displayName}</h4>
                        <p>{user.email}</p>
                        <div className="account-linked-providers">
                          <span>via</span>
                          <strong>{provider}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="price-divider" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Account ID</span>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted-foreground)" }}>{user.id.slice(0, 16)}…</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Authentication</span>
                        <strong>{provider}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Sync Status</span>
                        <span style={{ color: "var(--blue)", fontWeight: 550 }}>● Active</span>
                      </div>
                    </div>

                    <div className="price-divider" />
                    <button
                      className="button"
                      style={{ width: "100%", fontSize: 13 }}
                      onClick={async () => { await sb!.auth.signOut(); window.location.href = "/login"; }}
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>

                  {/* Plan Card */}
                  <div className={`price-card ${plan === "Premium" ? "premium" : ""}`}>
                    <div className="price-title">
                      <div>
                        <p className="small-note" style={{ marginBottom: 6 }}>MEMBERSHIP</p>
                        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {plan === "Premium"
                            ? <><Sparkles size={18} style={{ color: "#f59e0b" }} />Syntra Premium</>
                            : <><ShieldCheck size={18} style={{ color: "var(--blue)" }} />Syntra Free</>}
                        </h3>
                      </div>
                      {plan === "Premium" && <span><Sparkles size={10} /> ACTIVE</span>}
                    </div>

                    <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 8, marginBottom: 18 }}>
                      {plan === "Premium"
                        ? "You have full access to all Syntra desktop features and VIP profile tuning."
                        : "You're on the Free plan. Upgrade to unlock Gaming mode and advanced Windows tweaks."}
                    </p>

                    <ul>
                      {plan === "Premium" ? (
                        <>
                          <li><Check size={13} style={{ color: "#f59e0b" }} /> <strong>All performance profiles</strong> — Gaming, Creator & Balanced</li>
                          <li><Check size={13} style={{ color: "#f59e0b" }} /> <strong>Deep system cleanup</strong> — caches, telemetry & logs</li>
                          <li><Check size={13} style={{ color: "#f59e0b" }} /> <strong>Restore point generator</strong> before applying tweaks</li>
                          <li><Check size={13} style={{ color: "#f59e0b" }} /> <strong>Unlimited devices</strong> with this account</li>
                        </>
                      ) : (
                        <>
                          <li><Check size={13} style={{ color: "var(--blue)" }} /> Basic system scan & cleanup</li>
                          <li><Check size={13} style={{ color: "var(--blue)" }} /> Balanced everyday profile</li>
                          <li style={{ color: "var(--muted-foreground)", opacity: 0.75 }}>✕ Gaming mode & low-latency tweaks</li>
                          <li style={{ color: "var(--muted-foreground)", opacity: 0.75 }}>✕ Custom startup app management</li>
                        </>
                      )}
                    </ul>

                    {plan === "Free" && (
                      <>
                        <div className="price-divider" />
                        <button
                          className="button primary"
                          style={{ width: "100%", fontSize: 13 }}
                          onClick={handleUpgrade}
                          disabled={stripeLoading || activating}
                        >
                          {stripeLoading
                            ? <><Loader2 size={14} className="spin" /> Redirecting…</>
                            : <><Sparkles size={14} /> Upgrade to Premium — $15 <ArrowRight size={13} /></>}
                        </button>
                        <p className="small-note" style={{ textAlign: "center", marginTop: 10 }}>
                          {activating ? "Payment received — activating Premium on your account…" : "One-time payment · No subscription"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop Sync Steps */}
                <div className="price-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--secondary)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--blue)" }}>
                      <Laptop size={17} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 550, margin: 0 }}>Sync with Desktop App</h3>
                      <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "2px 0 0" }}>How your web account connects with the PC application</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                      { step: "01", title: "Download the App", desc: "Install Syntra Optimizer for Windows on your computer." },
                      { step: "02", title: `Sign in with ${provider}`, desc: `In the desktop sign-in screen, choose ${provider}.` },
                      { step: "03", title: "Instant Activation", desc: `Your ${plan} tier and profile are immediately recognized on your PC.` },
                    ].map(({ step, title, desc }) => (
                      <div key={step} style={{ padding: "16px 18px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--blue)" }}>STEP {step}</span>
                        <h4 style={{ fontSize: 14, fontWeight: 580, margin: "6px 0 4px" }}>{title}</h4>
                        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
