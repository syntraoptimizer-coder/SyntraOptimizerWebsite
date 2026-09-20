"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("velyro-cookie-consent");
      if (!consent) {
        setShow(true);
      }
    } catch {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("velyro-cookie-consent", "all");
    } catch {}
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("velyro-cookie-consent", "essential");
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent banner"
      style={{
        position: "fixed",
        bottom: 24,
        left: 20,
        right: 20,
        maxWidth: 520,
        margin: "0 auto",
        zIndex: 9999,
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: "0 24px 60px -15px rgba(0,0,0,0.3)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
            color: "var(--blue)",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: "-0.3px" }}>
              We value your privacy
            </h4>
            <button
              onClick={handleDecline}
              aria-label="Close cookie banner"
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: "var(--muted-foreground)",
                borderRadius: 6,
                display: "flex",
              }}
            >
              <X size={15} />
            </button>
          </div>

          <p style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.55, color: "var(--muted-foreground)" }}>
            We use essential cookies to maintain your login session and preferences. We also use analytics to improve Velyro Optimizer. Read our{" "}
            <a
              href="/cookies"
              style={{ color: "var(--blue)", textDecoration: "underline" }}
            >
              Cookie Policy
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              style={{ color: "var(--blue)", textDecoration: "underline" }}
            >
              Privacy Policy
            </a>.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="button primary compact"
              onClick={handleAccept}
              style={{ fontSize: 12.5, padding: "8px 16px" }}
            >
              Accept All
            </button>
            <button
              type="button"
              className="button secondary compact"
              onClick={handleDecline}
              style={{ fontSize: 12.5, padding: "8px 16px" }}
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
