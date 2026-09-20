"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { RefreshCw, ChevronDown, Moon, Sun, Menu, X, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { getSupabase } from "@/lib/supabase";

export default function RefundPage() {
  const [light, setLight] = useState(true);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<"Free" | "Premium">("Free");
  const [avatarErr, setAvatarErr] = useState(false);

  const sb = getSupabase();

  useEffect(() => {
    try { setLight(localStorage.getItem("syntra-theme") !== "dark"); } catch {}
  }, []);

  useEffect(() => {
    if (light) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try { localStorage.setItem("syntra-theme", light ? "light" : "dark"); } catch {}
  }, [light]);

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
                <RefreshCw size={13} /> SATISFACTION GUARANTEE
              </span>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 550, letterSpacing: "-1.5px", margin: "14px 0 10px" }}>
                Refund Policy
              </h1>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
                Last updated: September 20, 2026 · 14-Day Guarantee
              </p>
            </div>

            <div className="price-card" style={{ padding: "36px 32px", fontSize: 14.5, lineHeight: 1.75 }}>
              <section style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)", marginBottom: 20 }}>
                  <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: 15, display: "block", marginBottom: 2 }}>14-Day Money-Back Guarantee</strong>
                    <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                      If Velyro Optimizer Premium does not meet your expectations, you are entitled to a full refund within 14 calendar days of purchase.
                    </span>
                  </div>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  1. Scope of the Guarantee
                </h2>
                <p style={{ margin: 0 }}>
                  We want you to be completely satisfied with Velyro Optimizer. While our <strong>Free</strong> tier allows you to test the software with zero risk, purchasing <strong>Velyro Optimizer Premium ($15 USD)</strong> is fully protected by our 14-day refund policy.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  2. Eligibility Requirements
                </h2>
                <p style={{ margin: "0 0 10px" }}>You qualify for a refund if:</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    Your refund request is submitted within <strong>14 days</strong> from the exact date and time of purchase.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    The software experienced technical incompatibilities on your hardware that our support team was unable to resolve.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    The purchase was made directly on our website via Stripe (not via an unauthorized third-party reseller).
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  3. How to Request a Refund
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  To start your refund, simply email our customer support team:
                </p>
                <div style={{ padding: "16px 20px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 14 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13 }}>
                    Send an email to: <strong style={{ color: "var(--blue)" }}>support@velyro.com</strong>
                  </p>
                  <p style={{ margin: "0 0 6px", fontSize: 13 }}>
                    Subject line: <code>[Refund Request] - Your Account Email</code>
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
                    Include: Your Stripe receipt number or transaction date. (Optionally, a brief explanation of the reason helps us improve our product).
                  </p>
                </div>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  4. Processing & Payout Timeline
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  Once your request is received, we will review it within <strong>24 to 48 business hours</strong>.
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  Approved refunds are automatically returned to your original payment method via Stripe. Depending on your financial institution, funds typically appear in your bank account or card balance within <strong>5 to 10 business days</strong>.
                </p>
                <p style={{ margin: 0 }}>
                  Upon refund completion, your account plan will automatically return to <strong>Free</strong> tier, and Premium tweaks in the desktop app will be deactivated.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  5. Friendly Support Notice
                </h2>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <AlertCircle size={18} style={{ color: "var(--blue)", flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted-foreground)" }}>
                    If you are experiencing any performance issues, crashes, or configuration questions, please reach out to us at <span style={{ color: "var(--foreground)", fontWeight: 500 }}>support@velyro.com</span> before initiating a bank dispute or chargeback. We will be happy to assist you or immediately issue your refund directly.
                  </p>
                </div>
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
            <a href="/refund" style={{ color: "var(--blue)" }}>Refunds</a>
            <a href="/cookies">Cookies</a>
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
