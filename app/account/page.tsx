"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Laptop,
  LogOut,
  Mail,
  Monitor,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function AccountPage() {
  const [light, setLight] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"Free" | "Premium">("Free");
  const [avatarErr, setAvatarErr] = useState(false);

  const sb = getSupabase();

  useEffect(() => {
    try {
      setLight(localStorage.getItem("syntra-theme") !== "dark");
    } catch {}
  }, []);

  useEffect(() => {
    if (light) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try {
      localStorage.setItem("syntra-theme", light ? "light" : "dark");
    } catch {}
  }, [light]);

  useEffect(() => {
    if (!sb) {
      setLoading(false);
      return;
    }
    let active = true;

    async function checkUser() {
      const { data } = await sb!.auth.getUser();
      if (!active) return;
      setUser(data.user);

      if (data.user) {
        try {
          const { data: lData, error } = await sb!
            .from("licenses")
            .select("plan")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (!active) return;
          if (!error && lData?.plan === "premium") {
            setPlan("Premium");
            setLoading(false);
            return;
          }

          const metaPlan = data.user.user_metadata?.plan || data.user.app_metadata?.plan;
          if (metaPlan === "premium") {
            setPlan("Premium");
            setLoading(false);
            return;
          }
          setPlan("Free");
        } catch {
          setPlan("Free");
        }
      }
      setLoading(false);
    }

    void checkUser();

    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  const meta = user?.user_metadata || {};
  const displayName = String(meta.full_name || meta.name || user?.email?.split("@")[0] || "Syntra Member");
  const avatarUrl = meta.avatar_url || meta.picture;
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";
  const provider = user?.app_metadata?.provider
    ? user.app_metadata.provider.charAt(0).toUpperCase() + user.app_metadata.provider.slice(1)
    : "Social Account";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "Geist, Arial, sans-serif"
    }}>
      {/* Top Navbar */}
      <header style={{
        height: "72px",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--card) 90%, transparent)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 30
      }}>
        <a href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 650,
          fontSize: "18px",
          textDecoration: "none",
          color: "var(--foreground)"
        }}>
          <img src="/assets/syntra-logo.png" width="32" height="32" alt="Syntra" style={{ borderRadius: "8px" }} />
          <span>Syntra <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>Optimizer</span></span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--muted-foreground)",
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--card)"
          }}>
            <ArrowLeft size={14} /> Back to Website
          </a>

          <button
            onClick={() => setLight(!light)}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--muted-foreground)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
            aria-label="Toggle theme"
          >
            {light ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: "40px 20px" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p style={{ color: "var(--muted-foreground)", fontSize: "15px" }}>Loading your account details…</p>
            </div>
          ) : !user ? (
            /* Unauthenticated: prompt login */
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "var(--card)",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              maxWidth: "540px",
              margin: "40px auto"
            }}>
              <img src="/assets/syntra-logo.png" width="56" height="56" alt="" style={{ borderRadius: "12px", marginBottom: "16px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px 0" }}>You are not signed in</h2>
              <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: "0 0 24px 0" }}>
                Connect your account via Google, Discord, Microsoft, or GitHub to manage your license and sync settings.
              </p>
              <a
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontWeight: 550,
                  fontSize: "14px",
                  textDecoration: "none"
                }}
              >
                Go to Sign In <ArrowRight size={15} />
              </a>
            </div>
          ) : (
            /* Authenticated Account Dashboard */
            <div>
              {/* Top Banner */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "32px"
              }}>
                <div>
                  <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.5px", margin: "0 0 4px 0" }}>
                    Account Overview
                  </h1>
                  <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: 0 }}>
                    Manage your Syntra Optimizer license and connected desktop devices.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    await sb!.auth.signOut();
                    window.location.href = "/login";
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 16px",
                    borderRadius: "9px",
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--foreground)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>

              {/* Grid with 2 Columns */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px"
              }}>
                {/* 1. User Profile Card */}
                <div style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "28px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid var(--border)",
                      background: "var(--muted)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0
                    }}>
                      {avatarUrl && !avatarErr ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarErr(true)}
                        />
                      ) : (
                        <span style={{ fontSize: "24px", fontWeight: 650, color: "var(--blue)" }}>{initial}</span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 2px 0" }}>{displayName}</h3>
                      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>{user.email}</p>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "16px",
                    fontSize: "13px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Authentication</span>
                      <strong>{provider}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Account ID</span>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted-foreground)" }}>
                        {user.id.slice(0, 16)}…
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted-foreground)" }}>Sync Status</span>
                      <span style={{ color: "var(--blue)", fontWeight: 550 }}>Active</span>
                    </div>
                  </div>
                </div>

                {/* 2. Plan Card */}
                <div style={{
                  background: plan === "Premium"
                    ? "linear-gradient(145deg, rgba(245,158,11,0.08), rgba(63,111,224,0.12)), var(--card)"
                    : "var(--card)",
                  border: plan === "Premium" ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "var(--muted-foreground)" }}>
                        MEMBERSHIP STATUS
                      </span>
                      <h3 style={{ fontSize: "22px", fontWeight: 600, margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "8px" }}>
                        {plan === "Premium" ? (
                          <>
                            <Sparkles size={20} style={{ color: "#f59e0b" }} />
                            <span>Syntra Premium</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={20} style={{ color: "var(--blue)" }} />
                            <span>Syntra Free Edition</span>
                          </>
                        )}
                      </h3>
                    </div>

                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 650,
                      background: plan === "Premium" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "var(--secondary)",
                      color: plan === "Premium" ? "#fff" : "var(--foreground)",
                      border: plan === "Premium" ? "none" : "1px solid var(--border)"
                    }}>
                      {plan === "Premium" ? "ACTIVE LICENSE" : "FREE TIER"}
                    </span>
                  </div>

                  <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "0 0 18px 0" }}>
                    {plan === "Premium"
                      ? "Your account has complete access to all Syntra desktop features and VIP profile tuning."
                      : "You are currently on the Free plan. Upgrade to unlock dedicated Gaming and advanced Windows tweaks."}
                  </p>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "12px",
                    marginBottom: "24px",
                    flex: 1
                  }}>
                    {plan === "Premium" ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "#f59e0b" }} /> <strong>All performance profiles:</strong> Gaming, Creator & Balanced
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "#f59e0b" }} /> <strong>System deep cleanup:</strong> Caches, telemetry, and logs
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "#f59e0b" }} /> <strong>Restore point generator</strong> before applying tweaks
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "#f59e0b" }} /> <strong>Unlimited devices</strong> with this account
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "var(--blue)" }} /> Basic system scan & temporary files cleanup
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Check size={14} style={{ color: "var(--blue)" }} /> Balanced everyday profile
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted-foreground)" }}>
                          ✕ Gaming mode low-latency tweaks (Premium)
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted-foreground)" }}>
                          ✕ Custom startup app management (Premium)
                        </div>
                      </>
                    )}
                  </div>

                  {plan === "Free" && (
                    <a
                      href="/#pricing"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #3f6fe0, #2554c7)",
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: "13px",
                        textDecoration: "none",
                        boxShadow: "0 4px 14px rgba(63, 111, 224, 0.3)"
                      }}
                    >
                      <Sparkles size={15} /> Upgrade to Premium for $15 <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* 3. Link with Desktop App Card */}
              <div style={{
                marginTop: "24px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "28px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--blue)"
                  }}>
                    <Laptop size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, margin: 0 }}>Sync with Syntra Optimizer Desktop App</h3>
                    <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: "2px 0 0 0" }}>
                      How your web account connects with the PC application
                    </p>
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "16px",
                  marginTop: "20px"
                }}>
                  <div style={{ padding: "16px", borderRadius: "12px", background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--blue)" }}>STEP 1</span>
                    <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "6px 0 4px 0" }}>Download the App</h4>
                    <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
                      Install Syntra Optimizer for Windows on your computer.
                    </p>
                  </div>

                  <div style={{ padding: "16px", borderRadius: "12px", background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--blue)" }}>STEP 2</span>
                    <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "6px 0 4px 0" }}>Sign in with {provider}</h4>
                    <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
                      In the desktop sign-in screen, choose <strong>{provider}</strong>.
                    </p>
                  </div>

                  <div style={{ padding: "16px", borderRadius: "12px", background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--blue)" }}>STEP 3</span>
                    <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "6px 0 4px 0" }}>Instant License Activation</h4>
                    <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
                      Your {plan} tier and profile photo are immediately recognized on your PC!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "24px 32px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--muted-foreground)",
        borderTop: "1px solid var(--border)"
      }}>
        © {new Date().getFullYear()} Syntra Optimizer. All rights reserved.
      </footer>
    </div>
  );
}
