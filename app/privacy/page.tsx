"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Shield, ChevronDown, Moon, Sun, Menu, X, ArrowUpRight } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { getSupabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";

export default function PrivacyPage() {
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
                <Shield size={13} /> LEGAL & COMPLIANCE
              </span>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 550, letterSpacing: "-1.5px", margin: "14px 0 10px" }}>
                Privacy Policy
              </h1>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
                Last updated: September 20, 2026 · Effective immediately
              </p>
            </div>

            <div className="price-card" style={{ padding: "36px 32px", fontSize: 14.5, lineHeight: 1.75 }}>
              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  1. Overview & Commitment
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  At <strong>Velyro Optimizer</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we firmly believe that system optimization software must respect user privacy. We are committed to protecting your personal information and ensuring total transparency regarding what information we collect, how it is used, and how it is protected.
                </p>
                <p style={{ margin: 0 }}>
                  Our desktop software is designed around a fundamental principle: <strong>your PC data stays on your PC</strong>. We do not upload personal files, scan documents, or track your browsing activity.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  2. Information We Collect
                </h2>
                <p style={{ margin: "0 0 10px" }}>We only collect the minimum data necessary to operate our service and license system:</p>
                <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Account Information:</strong> When you register via email or OAuth (Google, Discord, Microsoft, GitHub), we store your email address, user ID, and display name to identify your account and grant your license.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>License & Device Link:</strong> To enforce the 1-PC-per-account policy, the desktop app generates an anonymous machine identifier (hardware hash) and reports Windows OS version (e.g., Windows 11 64-bit) so you can view and transfer your connected computer from your account page.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Payment Information:</strong> All financial transactions are processed directly by our payment provider, Stripe. We never store, receive, or process your credit card or banking details.
                  </li>
                  <li>
                    <strong>Preferences:</strong> Website settings such as theme (light/dark) and cookie consent status are saved locally in your browser storage.
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  3. What We Do NOT Collect
                </h2>
                <p style={{ margin: "0 0 10px" }}>Velyro Optimizer does not:</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 6 }}>Upload your personal files, photos, downloads, or documents.</li>
                  <li style={{ marginBottom: 6 }}>Track websites you visit, keystrokes, or screen contents.</li>
                  <li style={{ marginBottom: 6 }}>Sell, rent, or trade personal data with advertisers or data brokers.</li>
                  <li>Run unsolicited background cryptocurrency mining or bundled third-party adware.</li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  4. Third-Party Service Providers
                </h2>
                <p style={{ margin: "0 0 10px" }}>We work with trusted infrastructure providers that adhere to high security standards:</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Supabase:</strong> For cloud authentication, account security, and license database storage (hosted on SOC 2 Type II certified cloud infrastructure).
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Stripe:</strong> For PCI-DSS compliant checkout and payment processing.
                  </li>
                  <li>
                    <strong>VirusTotal / GitHub:</strong> For binary distribution and verifiable antivirus multi-engine scanning.
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  5. Your Rights (GDPR & CCPA)
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  Regardless of your location, you have the right to access, rectify, or completely delete your personal data. You may review your account and the PC linked to it from your Account dashboard, and delete your account or unlink a device by writing to our privacy team.
                </p>
                <p style={{ margin: 0 }}>
                  Upon receiving a verified account deletion request, all personal identifiers, machine IDs, and license tokens associated with your account are permanently erased within 30 days.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  6. Contact Information
                </h2>
                <p style={{ margin: "0 0 6px" }}>
                  If you have questions, inquiries, or privacy concerns, contact our team:
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
            <a href="/privacy" style={{ color: "var(--blue)" }}>Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refund">Refunds</a>
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
