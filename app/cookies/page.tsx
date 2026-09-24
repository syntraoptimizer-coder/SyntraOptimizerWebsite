"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Cookie, ChevronDown, Moon, Sun, Menu, X, ArrowUpRight } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { getSupabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";

export default function CookiesPage() {
  const [light, setLight] = useTheme();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"Free" | "Premium">("Free");
  const [avatarErr, setAvatarErr] = useState(false);

  const sb = getSupabase();

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 28); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = sb.auth.onAuthStateChange((_event, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!sb || !user) return;
    async function checkPlan() {
      try {
        const { data } = await sb!.from("licenses").select("plan").eq("user_id", user!.id).maybeSingle();
        if (data?.plan === "premium" || user!.app_metadata?.plan === "premium") setPlan("Premium");
      } catch {}
    }
    void checkPlan();
  }, [user, sb]);

  const meta = user?.user_metadata || {};
  const displayName = String(meta.full_name || meta.name || user?.email?.split("@")[0] || "Account");
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
              <a href="/login" className="nav-demo">Sign in</a>
            )}
            <a href="/download" className="button primary compact">
              Get Velyro <ArrowUpRight size={14} />
            </a>
            <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {/* ── Main Legal Content ── */}
        <main id="main" style={{ flex: 1, padding: "64px 20px 100px" }}>
          <article style={{ maxWidth: 840, margin: "0 auto" }}>
            <div style={{ marginBottom: 36 }}>
              <span className="eyebrow" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Cookie size={13} /> TRANSPARENCY
              </span>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 550, letterSpacing: "-1.5px", margin: "14px 0 10px" }}>
                Cookie Policy
              </h1>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
                Last updated: September 20, 2026 · Compliant with GDPR & ePrivacy Directive
              </p>
            </div>

            <div className="price-card" style={{ padding: "36px 32px", fontSize: 14.5, lineHeight: 1.75 }}>
              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  1. What Are Cookies?
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  Cookies are small text files that websites store on your computer or mobile device when you visit. They are widely used to make websites work properly, keep you authenticated between sessions, and remember your visual preferences.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  2. Cookies & Local Storage We Use
                </h2>
                <p style={{ margin: "0 0 16px" }}>
                  Velyro Optimizer uses minimal local storage and cookies to maintain essential web functionality:
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14 }}>Strictly Necessary / Authentication</strong>
                      <span className="plan-badge plan-badge-free" style={{ fontSize: 11 }}>Essential</span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted-foreground)" }}>
                      Used to maintain your secure Supabase user session, token refresh, and login status across pages.
                    </p>
                    <code style={{ fontSize: 11.5, background: "var(--card)", padding: "2px 6px", borderRadius: 4 }}>
                      sb-*-auth-token (Session storage)
                    </code>
                  </div>

                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14 }}>Preferences & Interface</strong>
                      <span className="plan-badge plan-badge-free" style={{ fontSize: 11 }}>Functional</span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted-foreground)" }}>
                      Remembers your dark/light visual theme choice and whether you have acknowledged the cookie consent banner.
                    </p>
                    <code style={{ fontSize: 11.5, background: "var(--card)", padding: "2px 6px", borderRadius: 4, marginRight: 8 }}>
                      syntra-theme (Local Storage)
                    </code>
                    <code style={{ fontSize: 11.5, background: "var(--card)", padding: "2px 6px", borderRadius: 4 }}>
                      velyro-cookie-consent (Local Storage)
                    </code>
                  </div>

                  <div style={{ padding: "16px 18px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14 }}>Payment & Fraud Prevention</strong>
                      <span className="plan-badge plan-badge-free" style={{ fontSize: 11 }}>Security</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
                      When accessing the Checkout modal, Stripe may set security cookies necessary to prevent credit card fraud and protect transactions.
                    </p>
                  </div>
                </div>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  3. Managing and Disabling Cookies
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  You can control and/or delete cookies at any time via your browser settings:
                </p>
                <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
                  <li style={{ marginBottom: 6 }}>In Google Chrome: Settings → Privacy and security → Cookies and other site data.</li>
                  <li style={{ marginBottom: 6 }}>In Mozilla Firefox: Settings → Privacy & Security → Enhanced Tracking Protection.</li>
                  <li style={{ marginBottom: 6 }}>In Microsoft Edge: Settings → Cookies and site permissions.</li>
                  <li>In Apple Safari: Preferences → Privacy → Block all cookies.</li>
                </ul>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
                  Please note that blocking essential cookies may prevent you from logging into your account or downloading the software.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  4. Questions & Inquiries
                </h2>
                <p style={{ margin: "0 0 6px" }}>
                  For any questions regarding our cookie practices, reach out to our privacy officer:
                </p>
                <p style={{ margin: 0, fontWeight: 550, color: "var(--blue)" }}>
                  support@velyro.com
                </p>
              </section>
            </div>
          </article>
        </main>

        {/* ── Footer ── */}
        <footer>
          <a href="/" className="brand">
            <img src="/assets/syntra-logo.png" width="26" height="26" alt="" />
            <span>Velyro<span className="brand-sub"> Optimizer</span></span>
          </a>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refund">Refunds</a>
            <a href="/cookies" style={{ color: "var(--blue)" }}>Cookies</a>
          </div>
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
