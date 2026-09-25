"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ArrowDownToLine, ArrowRight, Check, CheckCheck, ChevronRight, Copy, CreditCard, Laptop, Loader2, LogOut, Moon, ShieldCheck, Sparkles, Sun, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeviceCard from "@/components/DeviceCard";
import TwoFactorCard from "@/components/TwoFactorCard";
import { getAvatarUrl } from "@/lib/avatar";
import { product } from "@/lib/product";

const sections = [
  { id: "profile", label: "Profile", icon: UserRound, description: "Your account details and the way Velyro looks." },
  { id: "security", label: "Security", icon: ShieldCheck, description: "Add another layer of protection to your account." },
  { id: "devices", label: "Linked PC", icon: Laptop, description: "View the PC linked to your Velyro account." },
  { id: "license", label: "Your plan", icon: CreditCard, description: "Your Velyro license, features and upgrade options." },
];

export default function AccountSettings({ sb, user, plan, light, setLight, onUpgrade, upgrading, activating, checkoutError }: {
  sb: SupabaseClient; user: User; plan: "Free" | "Premium";
  light: boolean; setLight: (value: boolean) => void;
  onUpgrade: () => void; upgrading: boolean; activating: boolean; checkoutError: string;
}) {
  const [section, setSection] = useState("profile");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [compact, setCompact] = useState(false);
  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Velyro Member");
  const avatar = getAvatarUrl(user);
  const providers = [...new Set(user.identities?.map((identity) => identity.provider) ?? [user.app_metadata?.provider || "email"])];
  const providerNames: Record<string, string> = { email: "Email and password", google: "Google", discord: "Discord", azure: "Microsoft", github: "GitHub" };
  const activeSection = sections.find((item) => item.id === section)!;

  useEffect(() => {
    if (activating || checkoutError) setSection("license");
  }, [activating, checkoutError]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyId() {
    try { await navigator.clipboard.writeText(user.id); setCopied(true); setError(""); }
    catch { setError("Could not copy your account ID. Please try again."); }
  }
  async function signOut() {
    setSigningOut(true); setError("");
    try {
      const { error } = await sb.auth.signOut();
      if (error) throw error;
      window.location.href = "/login";
    } catch { setError("We couldn't sign you out. Please try again."); setSigningOut(false); }
  }
  const avatarContent = avatar && !avatarFailed
    // External provider avatars cannot be known ahead of time by the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={avatar} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />
    : <span>{name.trim().charAt(0).toUpperCase()}</span>;

  return (
    <div className="settings-workspace">
      <div className="settings-breadcrumb"><a href="/">Home</a><ChevronRight size={13} /><span>Account settings</span></div>
      <div className="settings-page-heading"><div><h1>Account settings</h1><p>Manage your profile, security and Velyro license.</p></div><a href="/download" className="button settings-download"><ArrowDownToLine size={16} /> Get the desktop app</a></div>
      <Tabs value={section} onValueChange={setSection} orientation={compact ? "horizontal" : "vertical"} className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-identity"><div className="settings-avatar small">{avatarContent}</div><div><strong>{name}</strong><span>{plan} member</span></div></div>
          <TabsList aria-label="Account settings" className="settings-nav">
            {sections.map(({ id, label, icon: Icon }) => <TabsTrigger key={id} value={id} className="settings-nav-item"><Icon size={18} /><span>{label}</span><ChevronRight size={14} className="settings-nav-chevron" /></TabsTrigger>)}
          </TabsList>
          <div className="settings-sidebar-bottom"><button className="settings-signout" onClick={signOut} disabled={signingOut}>{signingOut ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />} Sign out</button></div>
        </aside>

        <div className="settings-content">
          <header className="settings-section-heading"><h2>{activeSection.label}</h2><p>{activeSection.description}</p></header>
          {error && <p className="settings-notice error" role="alert">{error}</p>}

          <TabsContent value="profile" forceMount className="settings-panel">
            <section className="settings-card">
              <div className="settings-profile-banner"><div className="settings-avatar">{avatarContent}</div><div className="settings-profile-name"><h3>{name}</h3><p>{user.email || "Velyro account"}</p></div><span className="settings-badge">{plan === "Premium" ? <Sparkles size={13} /> : <UserRound size={13} />}{plan} plan</span></div>
              <div className="settings-card-body"><div className="settings-card-heading"><h3>Personal details</h3><p>The information connected to your account.</p></div>
                <dl className="settings-details">
                  <div><dt>Display name</dt><dd>{name}</dd></div>
                  <div><dt>Email address</dt><dd><span>{user.email || "No email address"}</span>{user.email_confirmed_at && <span className="settings-verified"><CheckCheck size={14} /> Verified</span>}</dd></div>
                  <div><dt>Sign-in method</dt><dd>{providers.map((provider) => <span className="settings-provider" key={provider}>{providerNames[provider] || provider}</span>)}</dd></div>
                  <div><dt>Account ID</dt><dd className="settings-id"><code>{user.id}</code><button onClick={copyId} aria-label="Copy account ID" className="settings-icon-button">{copied ? <Check size={16} /> : <Copy size={16} />}</button><span className="sr-only" role="status">{copied ? "Account ID copied" : ""}</span></dd></div>
                </dl>
              </div>
              <div className="settings-card-footnote"><ShieldCheck size={15} /><span>Your details come from the account you use to sign in.</span></div>
            </section>

            <section className="settings-card settings-card-body"><div className="settings-card-heading"><h3>Appearance</h3><p>Choose the theme that feels right. Saved on this browser.</p></div>
              <div className="settings-theme-options" role="group" aria-label="Color theme">
                {[{ value: false, label: "Dark", icon: Moon }, { value: true, label: "Light", icon: Sun }].map(({ value, label, icon: Icon }) => <button key={label} type="button" aria-pressed={light === value} className={`settings-theme ${value ? "light-preview" : "dark-preview"}`} onClick={() => setLight(value)}><span className="settings-theme-preview" aria-hidden="true"><span className="settings-mini-sidebar"><i /><i /><i /></span><span className="settings-mini-content"><i /><span><i /><i /></span></span></span><span className="settings-theme-label"><Icon size={16} />{label}<span className="settings-theme-check">{light === value && <Check size={12} />}</span></span></button>)}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="security" forceMount className="settings-panel">
            <TwoFactorCard sb={sb} user={user} />
            <div className="settings-tip"><ShieldCheck size={20} /><div><h3>A small step. A safer account.</h3><p>A second verification helps protect your account if someone gets hold of your password. Keep your recovery codes somewhere safe when using an authenticator app.</p></div></div>
          </TabsContent>

          <TabsContent value="devices" forceMount className="settings-panel">
            <DeviceCard sb={sb} user={user} />
            <section className="settings-card settings-card-body"><div className="settings-card-heading"><h3>Set up Velyro on your PC</h3><p>Your web account and desktop app use the same sign-in.</p></div><ol className="settings-steps"><li><span>01</span><div><h4>Install the desktop app</h4><p>Download Velyro Optimizer for Windows.</p></div></li><li><span>02</span><div><h4>Sign in to this account</h4><p>Use the same email address or connected provider.</p></div></li><li><span>03</span><div><h4>You’re ready to go</h4><p>Your {plan} license is recognized by the app.</p></div></li></ol><a href="/download" className="button"><ArrowDownToLine size={16} /> Download for Windows</a></section>
          </TabsContent>

          <TabsContent value="license" forceMount className="settings-panel">
            <section className="settings-card settings-license"><div className="settings-license-top"><div className="settings-license-symbol"><Sparkles size={25} /></div><span className="settings-badge">Current plan</span></div><p className="settings-overline">YOUR MEMBERSHIP</p><h3>Velyro {plan}</h3><p>{plan === "Premium" ? "More control. Every performance profile. All yours." : "The essentials for a cleaner, smoother PC."}</p><div className="settings-license-summary"><span>{plan === "Premium" ? "Premium access" : "Free access"}</span><span>No subscription</span><span>One PC</span></div></section>
            <section className="settings-card settings-card-body"><div className="settings-card-heading"><h3>{plan === "Premium" ? "Included in your plan" : "Make more of your PC"}</h3><p>{plan === "Premium" ? "Your Premium features are available in the desktop app." : "Go Premium for more performance profiles and advanced tools."}</p></div>
              <ul className="settings-benefits">{(plan === "Premium" ? ["Gaming, Creator and Balanced profiles", "Deep system cleanup", "Restore points before applying tweaks", "Advanced Windows tweaks"] : ["Gaming mode and low-latency tweaks", "Advanced Windows tweaks", "Custom startup app management", "All performance profiles"]).map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
              {plan === "Free" ? <div className="settings-upgrade-row"><div><strong>${product.premiumPrice}<span> / one time</span></strong><p>No recurring charges.</p></div><button className="button primary" disabled={upgrading || activating} onClick={onUpgrade}>{upgrading || activating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}{activating ? "Activating…" : upgrading ? "Redirecting…" : "Get Premium"}<ArrowRight size={15} /></button></div> : <a href="/download" className="button primary"><ArrowDownToLine size={16} /> Open the download page</a>}
              {activating && <p className="settings-notice" role="status">Checking your payment and activating Premium…</p>}
              {checkoutError && <p className="settings-notice error" role="alert">{checkoutError}</p>}
            </section>
          </TabsContent>
          <button className="settings-signout settings-mobile-signout" onClick={signOut} disabled={signingOut}>{signingOut ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />} Sign out</button>
        </div>
      </Tabs>
    </div>
  );
}
