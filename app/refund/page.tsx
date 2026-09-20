"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { RefreshCw, ChevronDown, Moon, Sun, Menu, X, ArrowUpRight, CheckCircle2, AlertCircle, Laptop } from "lucide-react";
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
                      If you encounter genuine technical difficulties or performance incompatibilities with Velyro Optimizer Premium, you are entitled to request a refund within 14 calendar days of your initial purchase.
                    </span>
                  </div>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  1. Scope of the Guarantee
                </h2>
                <p style={{ margin: 0 }}>
                  We strive to build the most efficient and safe PC optimization tool for Windows. While our <strong>Free</strong> tier allows you to test fundamental features without spending a cent, our <strong>Premium</strong> license ($15 USD one-time payment) comes with our dedicated support and refund guarantee.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  2. Eligibility Requirements
                </h2>
                <p style={{ margin: "0 0 10px" }}>To qualify for a refund, all the following criteria must be met:</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Timeframe:</strong> Your refund request must be submitted within <strong>14 calendar days</strong> of the original purchase timestamp shown on your Stripe receipt.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Official Purchase:</strong> The license must have been purchased directly through our official website (<a href="/" style={{ color: "var(--blue)" }}>velyro.com</a>) via Stripe.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Genuine Technical Issue:</strong> The software fails to operate properly on your compatible PC (e.g., persistent crash, severe incompatibility, or profile application failure) that our support team is unable to rectify.
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              {/* ── Section 3: AnyDesk Remote Verification ── */}
              <section style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Laptop size={20} style={{ color: "var(--blue)" }} />
                  <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: 0 }}>
                    3. Technical Verification & Remote Support (AnyDesk)
                  </h2>
                </div>
                <p style={{ margin: "0 0 12px" }}>
                  Because digital software licenses grant immediate access to proprietary code, optimization configurations, and system scripts, <strong>we reserve the right to verify and diagnose reported issues before issuing a refund</strong>.
                </p>
                
                <div style={{ padding: "18px 20px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)", marginBottom: 14 }}>
                  <strong style={{ fontSize: 14, display: "block", marginBottom: 6, color: "var(--foreground)" }}>
                    How the AnyDesk Diagnostic Process Works:
                  </strong>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13.5, color: "var(--muted-foreground)" }}>
                    <li style={{ marginBottom: 8 }}>
                      <strong>Scheduled Remote Session:</strong> When you report a bug, crash, or optimization failure, a certified Velyro technician will request a quick session via <strong>AnyDesk</strong> (a trusted, secure remote desktop application).
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <strong>Total User Control:</strong> You remain in front of your screen at all times. You can see every click and command executed by our technician, and you may terminate the session with a single click at any second.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <strong>Strict Confidentiality:</strong> Our technicians only inspect Velyro Optimizer application logs, Windows event viewers, and relevant performance metrics. We never inspect, open, or copy personal files, documents, or passwords.
                    </li>
                    <li>
                      <strong>100% Free:</strong> Remote diagnostic and troubleshooting sessions are entirely free of charge.
                    </li>
                  </ul>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 14 }}>
                  <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
                    <strong style={{ fontSize: 13, color: "#10b981", display: "block", marginBottom: 4 }}>
                      ✓ Issue Confirmed & Unresolvable
                    </strong>
                    <span style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>
                      If the AnyDesk session confirms the incompatibility or defect cannot be fixed on your machine, your refund will be approved and processed immediately.
                    </span>
                  </div>

                  <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)" }}>
                    <strong style={{ fontSize: 13, color: "var(--blue)", display: "block", marginBottom: 4 }}>
                      ✓ Issue Resolved by Technician
                    </strong>
                    <span style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>
                      If our technician resolves the conflict (e.g., driver conflict or permission setting), you can enjoy your fully working Premium license.
                    </span>
                  </div>
                </div>

                <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
                  <em>Note:</em> In accordance with digital consumer protection laws regarding immediately consumable digital licenses, <strong>refusing to allow our support team to verify or diagnose a claimed defect via AnyDesk without valid justification may result in the denial of your refund claim</strong>.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  4. Non-Refundable Situations
                </h2>
                <p style={{ margin: "0 0 10px" }}>Refunds are not granted in the following scenarios:</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    Requests submitted after the <strong>14-day warranty period</strong> has elapsed.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    Change of mind after the software has been downloaded, activated, and verified as fully functional on your machine.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    Failure of hardware or external components completely unrelated to Velyro Optimizer (e.g., thermal throttling, faulty power supplies, physical GPU defects).
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    Unrealistic or arbitrary FPS expectations where the hardware itself is bottlenecked by physical components.
                  </li>
                  <li>
                    Accounts suspended or terminated due to unauthorized reverse engineering, piracy, or commercial redistribution of our binary files.
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  5. How to Submit a Refund Request
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  To submit your request, email our technical assistance desk:
                </p>
                <div style={{ padding: "18px 22px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", marginBottom: 14 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13.5 }}>
                    Recipient: <strong style={{ color: "var(--blue)" }}>support@velyro.com</strong>
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 13.5 }}>
                    Subject: <code>[Refund & Support Request] - Your Account Email</code>
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 13.5 }}>
                    Information required:
                  </p>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
                    <li>Your registered account email address.</li>
                    <li>Your Stripe transaction or receipt number.</li>
                    <li>A description of the technical issue encountered.</li>
                    <li>Your availability window for an AnyDesk diagnostic session (if technical issue).</li>
                  </ul>
                </div>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  6. Payout Timeline & License Revocation
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  Once your refund is approved by our technical desk:
                </p>
                <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
                  <li style={{ marginBottom: 8 }}>
                    Funds are returned directly to your original payment method via <strong>Stripe</strong>.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    Card refunds typically take between <strong>5 and 10 business days</strong> to credit back to your bank account statement.
                  </li>
                  <li>
                    Your account license automatically reverts to the <strong>Free tier</strong>, and Premium desktop tweaks will be safely disabled.
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  7. Dispute & Chargeback Warning
                </h2>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px", borderRadius: 12, background: "var(--secondary)", border: "1px solid var(--border)" }}>
                  <AlertCircle size={20} style={{ color: "var(--blue)", flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted-foreground)" }}>
                    Initiating a fraudulent bank dispute or payment chargeback without contacting our support first will result in immediate and permanent termination of your Velyro account and blacklist your hardware identifier from future activations. If you have an issue, write to <span style={{ color: "var(--foreground)", fontWeight: 500 }}>support@velyro.com</span> — we are always here to help you or promptly issue your legitimate refund.
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
