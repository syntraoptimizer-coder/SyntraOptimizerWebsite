"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { FileText, ChevronDown, Moon, Sun, Menu, X, ArrowUpRight } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { getSupabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";

export default function TermsPage() {
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
                <FileText size={13} /> USER AGREEMENT
              </span>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 550, letterSpacing: "-1.5px", margin: "14px 0 10px" }}>
                Terms of Service
              </h1>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>
                Last updated: September 20, 2026 · Effective immediately
              </p>
            </div>

            <div className="price-card" style={{ padding: "36px 32px", fontSize: 14.5, lineHeight: 1.75 }}>
              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  1. Acceptance of Terms
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  By downloading, installing, or accessing <strong>Velyro Optimizer</strong> (&quot;Software&quot;, &quot;Service&quot;), or using this website, you agree to be legally bound by these Terms of Service. If you do not agree to these terms, please do not download, install, or use the software.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  2. Grant of License
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  We grant you a revocable, non-exclusive, non-transferable, limited license to download, install, and execute the Software on your personal computer strictly in accordance with these Terms.
                </p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Device Limit:</strong> Each account license (Free or Premium) is permanently assigned to the <strong>first PC</strong> that signs in with it, identified by that computer&apos;s hardware ID. The assignment cannot be transferred: using Velyro Optimizer on a different PC requires purchasing a new license. Your account dashboard shows which PC your license is currently bound to.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Restrictions:</strong> You may not reverse engineer, decompile, disassemble, modify, rent, sublicense, or redistribute the binary installer or its proprietary optimization algorithms without prior written consent.
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  3. Free and Premium Plans
                </h2>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Free Plan:</strong> Provided free of charge for non-commercial personal use. Includes essential system scans, temporary file cleanup, and balanced performance profiles.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>Premium Plan:</strong> A one-time payment of <strong>$15 USD</strong> grants permanent Premium access to advanced optimization controls, dedicated gaming profiles, extended cleanup, and prioritized feature updates.
                  </li>
                  <li>
                    <strong>No Recurring Fees:</strong> Unless explicitly noted otherwise, Velyro Optimizer Premium is a lifetime, one-time payment without recurring monthly subscriptions.
                  </li>
                </ul>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  4. Safety, Restore Points & User Responsibility
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  Velyro Optimizer provides automated tools to tune system configurations, disable background services, and clear temporary files.
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  Before applying any registry tweak or aggressive optimization profile, the software recommends creating a <strong>Windows System Restore Point</strong>. You are responsible for ensuring that critical personal data is regularly backed up.
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  5. Disclaimer of Warranties & Limitation of Liability
                </h2>
                <p style={{ margin: "0 0 12px" }}>
                  THE SOFTWARE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
                <p style={{ margin: 0 }}>
                  Actual performance improvements, FPS gains, and latency reductions depend heavily on your specific hardware configuration, operating system build, and background workloads. IN NO EVENT SHALL VELYRO OPTIMIZER OR ITS AUTHORS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES (INCLUDING DATA LOSS OR SYSTEM INSTABILITY).
                </p>
              </section>

              <div className="price-divider" style={{ margin: "24px 0" }} />

              <section>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.4px", margin: "0 0 12px" }}>
                  6. Contact & Disputes
                </h2>
                <p style={{ margin: "0 0 6px" }}>
                  For questions about these Terms, licensing, or support:
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
            <a href="/terms" style={{ color: "var(--blue)" }}>Terms</a>
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
