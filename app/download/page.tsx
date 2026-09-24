"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Download, ShieldCheck, Check, Laptop, Monitor, ArrowRight,
  ChevronRight, ChevronDown, Moon, Sun, Menu, X, Sparkles,
  Lock, Loader2, ArrowUpRight, Cpu, HardDrive
} from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { getSupabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { product } from "@/lib/product";
import VirusTotalBadge from "@/components/VirusTotalBadge";

export default function DownloadPage() {
  const [light, setLight] = useTheme();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"Loading…" | "Free" | "Premium">("Loading…");
  const [loading, setLoading] = useState(true);
  const [avatarErr, setAvatarErr] = useState(false);

  const sb = getSupabase();

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 28); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!sb) {
      setLoading(false);
      return;
    }
    let active = true;
    sb.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    });
    const { data } = sb.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [sb]);

  useEffect(() => {
    if (!sb || !user) {
      if (!user) setPlan("Free");
      return;
    }
    let active = true;
    setPlan("Loading…");
    async function checkPlan() {
      try {
        const { data, error } = await sb!.from("licenses").select("plan").eq("user_id", user!.id).maybeSingle();
        if (!active) return;
        if (!error && data?.plan === "premium") { setPlan("Premium"); return; }
        const metaPlan = user!.app_metadata?.plan;
        if (metaPlan === "premium") { setPlan("Premium"); return; }
        setPlan("Free");
      } catch {
        if (active) setPlan("Free");
      }
    }
    void checkPlan();
    return () => { active = false; };
  }, [user, sb]);

  const meta = user?.user_metadata || {};
  const displayName = String(meta.full_name || meta.name || user?.email?.split("@")[0] || "Velyro Member");
  const avatarUrl = getAvatarUrl(user);
  const userInitial = displayName.trim().charAt(0).toUpperCase() || "V";

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div id="top" className="site-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── Navigation ── */}
        <header className={scrolled ? "navigation scrolled" : "navigation"}>
          <a href="/" className="brand" aria-label="Velyro Optimizer home">
            <img src="/assets/syntra-logo.png" width="30" height="30" alt="" />
            <span>Velyro<span className="brand-sub"> Optimizer</span></span>
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
                  {avatarUrl && !avatarErr
                    ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setAvatarErr(true)} />
                    : userInitial}
                </span>
                <span className="nav-user-name">{displayName.split(" ")[0]}</span>
                <span className={`nav-plan-pill ${plan === "Premium" ? "premium" : "free"}`}>
                  {plan === "Premium" ? "✦ Premium" : "Free"}
                </span>
              </a>
            ) : (
              <a href="/login?redirect=/download" className="nav-demo">Sign in</a>
            )}
            <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main id="main" style={{ flex: 1, padding: "56px 20px 80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ maxWidth: 940, width: "100%", margin: "0 auto" }}>

            {loading ? (
              <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <Loader2 size={32} className="spin" style={{ color: "var(--blue)", margin: "0 auto 16px", display: "block" }} />
                <p style={{ color: "var(--muted-foreground)", fontSize: 15 }}>Checking your session…</p>
              </div>
            ) : !user ? (
              /* ── Unauthenticated State: Sign In Required ── */
              <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "var(--secondary)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 550, color: "var(--blue)", marginBottom: 20 }}>
                  <Lock size={13} /> ACCOUNT REQUIRED TO DOWNLOAD
                </div>
                <h1 style={{ fontSize: "clamp(32px, 4.4vw, 54px)", lineHeight: 1.1, letterSpacing: "-1.8px", fontWeight: 500, margin: "0 0 16px" }}>
                  Sign in to download <br />
                  <span style={{ color: "var(--blue)" }}>Velyro Optimizer</span>
                </h1>
                <p style={{ fontSize: 16, color: "var(--muted-foreground)", lineHeight: 1.65, margin: "0 auto 32px", maxWidth: 500 }}>
                  To activate your license key and connect your PC, you must have an active Velyro account. Sign in or create a free account in seconds.
                </p>

                <div className="price-card" style={{ padding: "32px 28px", textAlign: "left", marginBottom: 36, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.15)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--secondary)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--blue)", flexShrink: 0 }}>
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 13, display: "block" }}>100% Free Plan Included</strong>
                        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No credit card required. Essential system scan & cleanup.</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--secondary)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--blue)", flexShrink: 0 }}>
                        <Laptop size={16} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 13, display: "block" }}>Automatic PC Activation</strong>
                        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Sign in on your PC desktop app to instantly link your settings.</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <a
                      href="/login?redirect=/download"
                      className="button primary"
                      style={{ justifyContent: "center", fontSize: 14, padding: "12px 24px" }}
                    >
                      Sign in or Create Account <ArrowRight size={16} />
                    </a>
                    <span style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center" }}>
                      Compatible with Windows 10 & Windows 11 (64-bit)
                    </span>
                  </div>
                </div>

                <VirusTotalBadge />
              </div>
            ) : (
              /* ── Authenticated State: Direct Download ── */
              <div>
                <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 36px" }}>
                  <span className="eyebrow" style={{ display: "inline-flex" }}>
                    <Check size={13} style={{ color: "#10b981" }} /> ACCOUNT CONNECTED · {user.email}
                  </span>
                  <h1 style={{ fontSize: "clamp(32px, 4vw, 50px)", lineHeight: 1.1, letterSpacing: "-1.6px", fontWeight: 500, margin: "14px 0 10px" }}>
                    Download Velyro Optimizer
                  </h1>
                  <p style={{ fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>
                    Your account is active. Click below to download the official Windows installer and boost your PC performance.
                  </p>
                </div>

                {/* Primary Download Card */}
                <div className="price-card" style={{ padding: "36px 32px", textAlign: "center", maxWidth: 680, margin: "0 auto 36px", boxShadow: "0 24px 60px -24px rgba(0,0,0,0.18)" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--secondary)", border: "1px solid var(--border)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
                    <img src="/assets/syntra-logo.png" width={40} height={40} alt="Velyro" />
                  </div>

                  <h2 style={{ fontSize: 22, fontWeight: 550, letterSpacing: "-0.5px", margin: "0 0 6px" }}>
                    Velyro Optimizer 1.0.0 for Windows
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "0 0 24px" }}>
                    Velyro.Optimizer.Setup.1.0.0.exe · 100.3 MB · Windows 10 / 11 (64-bit)
                  </p>

                  <a
                    href={product.downloadUrl}
                    download
                    className="button primary"
                    style={{ fontSize: 15, padding: "14px 32px", margin: "0 auto 18px", display: "inline-flex", gap: 10 }}
                  >
                    <Download size={18} /> Download for Windows (.exe)
                  </a>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--muted-foreground)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <ShieldCheck size={14} style={{ color: "var(--blue)" }} /> Verified Clean
                    </span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Monitor size={14} /> 64-bit Installer
                    </span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {plan === "Premium" ? (
                        <><Sparkles size={13} style={{ color: "#f59e0b" }} /> VIP Premium Plan</>
                      ) : (
                        <><Check size={13} style={{ color: "var(--blue)" }} /> Free Plan Active</>
                      )}
                    </span>
                  </div>
                </div>

                {/* 3 Steps Guide */}
                <div className="price-card" style={{ maxWidth: 780, margin: "0 auto 36px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 550, margin: "0 0 16px" }}>Getting started</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                    {[
                      { step: "01", title: "Run the Installer", desc: "Open Velyro.Optimizer.Setup.1.0.0.exe to install on your PC." },
                      { step: "02", title: "Sign In on Desktop", desc: `In the app sign-in window, use ${user.email} to link your PC.` },
                      { step: "03", title: "Enjoy Optimization", desc: `Your ${plan} profile is automatically unlocked with full system tuning.` },
                    ].map(({ step, title, desc }) => (
                      <div key={step} style={{ padding: "16px 18px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--blue)" }}>STEP {step}</span>
                        <h4 style={{ fontSize: 14, fontWeight: 580, margin: "6px 0 4px" }}>{title}</h4>
                        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ maxWidth: 780, margin: "0 auto" }}>
                  <VirusTotalBadge />
                </div>
              </div>
            )}

          </div>
        </main>

        {/* ── Footer ── */}
        <footer>
          <a href="/" className="brand">
            <img src="/assets/syntra-logo.png" width={26} height={26} alt="" />
            <span>Velyro<span className="brand-sub"> Optimizer</span></span>
          </a>
          <span>© {new Date().getFullYear()} Velyro Optimizer</span>
          <a href="#top">Back to top ↑</a>
        </footer>

      </div>

      <button className="theme-toggle" onClick={() => setLight(!light)} aria-label={light ? "Switch to dark theme" : "Switch to light theme"}>
        {light ? <Moon size={19} /> : <Sun size={19} />}
      </button>
    </>
  );
}
