"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight, Moon, ShieldCheck, Sun, ChevronDown, Loader2, Menu, X, ArrowUpRight,
} from "lucide-react";
import { getAvatarUrl } from '@/lib/avatar';
import { getSupabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { startCheckout } from "@/lib/checkout";
import AccountSettings from "@/components/AccountSettings";
import "./settings.css";

export default function AccountPage() {
  const [light, setLight] = useTheme();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"Free" | "Premium">("Free");
  const [avatarErr, setAvatarErr] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const sb = getSupabase();

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
    setCheckoutError("");
    setStripeLoading(true);
    const problem = await startCheckout();
    if (problem) {
      setCheckoutError(problem);
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
  const displayName = String(meta.full_name || meta.name || user?.email?.split("@")[0] || "Velyro Member");
  const avatarUrl = getAvatarUrl(user);
  const userInitial = displayName.trim().charAt(0).toUpperCase() || "V";

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div id="top" className="site-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: 0 }}>

        {/* ── Navigation identique à la homepage ── */}
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
            <a
              href="/download"
              className="button primary compact"
            >
              Get Velyro <ArrowUpRight size={14} />
            </a>
            <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        <main id="main" className="settings-main">
          {loading ? (
            <div className="settings-empty" role="status"><Loader2 size={26} className="spin" /><p>Loading your account…</p></div>
          ) : !user ? (
            <div className="settings-empty settings-card"><ShieldCheck size={32} /><h1>Your account, all in one place.</h1><p>Sign in to manage your profile, protect your account and find your Velyro license.</p><a href="/login" className="button primary">Sign in to your account <ArrowRight size={16} /></a></div>
          ) : (
            <AccountSettings sb={sb!} user={user} plan={plan} light={light} setLight={setLight} onUpgrade={handleUpgrade} upgrading={stripeLoading} activating={activating} checkoutError={checkoutError} />
          )}
        </main>

        <footer>
          <a href="/" className="brand">
            <img src="/assets/syntra-logo.png" width={26} height={26} alt="" />
            <span>Velyro<span className="brand-sub"> Optimizer</span></span>
          </a>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
            <a href="/privacy">Privacy</a>
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
