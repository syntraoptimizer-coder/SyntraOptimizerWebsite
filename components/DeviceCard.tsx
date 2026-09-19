"use client";
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, Mail, Monitor, RotateCcw } from "lucide-react";

type Status = { bound: boolean; linked_at: string | null; last_seen: string | null; resets_left: number };

const CONFIRM_PARAM = "device-reset";
const FRESH_SECONDS = 15 * 60; // must match reset_device() in supabase/migrations/004_device_reset.sql

/** True when the current session was created by an e-mailed link in the last 15 minutes (UI hint only:
 *  the database re-checks this inside reset_device(), so it can't be faked from the browser). */
function emailFresh(accessToken: string | undefined) {
  try {
    const payload = JSON.parse(atob((accessToken ?? "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.amr ?? []).some(
      (a: { method: string; timestamp: number }) =>
        (a.method === "otp" || a.method === "magiclink") && a.timestamp > Date.now() / 1000 - FRESH_SECONDS,
    );
  } catch {
    return false;
  }
}

function friendly({ message, code }: { message: string; code?: string }) {
  if (/reset limit/i.test(message)) return "You've reached the reset limit (2 per 30 days). Contact support if you need more.";
  if (/email confirmation required/i.test(message)) return "Please confirm with the link we email you first.";
  if (/rate limit|seconds|too many|over_email_send_rate_limit/i.test(`${message} ${code ?? ""}`))
    return "Too many emails were sent recently. Wait a few minutes before asking again.";
  if (/signups not allowed|user not found|otp_disabled/i.test(`${message} ${code ?? ""}`))
    return "This account can't receive a confirmation link because no email sign-in exists for it yet. Contact support and we'll reset it for you.";
  if (/sending|smtp|unexpected_failure/i.test(`${message} ${code ?? ""}`))
    return "The confirmation email could not be sent right now. Please try again in a few minutes.";
  return `Something went wrong: ${message}${code ? ` (${code})` : ""}`;
}
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export default function DeviceCard({ sb, user }: { sb: SupabaseClient; user: User }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [fresh, setFresh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: rpcError } = await sb.rpc("device_status");
    if (!rpcError) setStatus(data as Status);
    const { data: session } = await sb.auth.getSession();
    setFresh(emailFresh(session.session?.access_token));
  }, [sb]);
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: rpcError } = await sb.rpc("device_status");
      const { data: session } = await sb.auth.getSession();
      if (!active) return;
      if (!rpcError) setStatus(data as Status);
      setFresh(emailFresh(session.session?.access_token));
    })();
    return () => { active = false; };
  }, [sb]);

  const arrivedFromEmail =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("confirm") === CONFIRM_PARAM;

  async function sendEmail() {
    if (!user.email) { setError("This account has no email address, so it can't be confirmed by email."); return; }
    setBusy(true); setError("");
    const { error: otpError } = await sb.auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/account?confirm=${CONFIRM_PARAM}` },
    });
    setBusy(false);
    if (otpError) setError(friendly(otpError)); else setSent(true);
  }

  async function confirmReset() {
    setBusy(true); setError("");
    const { error: rpcError } = await sb.rpc("reset_device");
    setBusy(false);
    if (rpcError) { setError(friendly(rpcError)); return; }
    setDone(true);
    window.history.replaceState(null, "", "/account");
    void load();
  }

  const canConfirm = fresh && arrivedFromEmail && !done;
  return (
    <div className="price-card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--secondary)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--blue)" }}>
          <Monitor size={17} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 550, margin: 0 }}>Linked PC</h3>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "2px 0 0" }}>
            Your license works on one PC at a time, linked to its hardware ID (HWID).
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--muted-foreground)" }}>Status</span>
          <strong>{status ? (status.bound ? "PC linked" : "No PC linked yet") : "…"}</strong>
        </div>
        {status?.bound && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Linked on</span><span>{fmt(status.linked_at)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Last seen</span><span>{fmt(status.last_seen)}</span>
            </div>
          </>
        )}
        {status && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted-foreground)" }}>Resets left (30 days)</span><span>{status.resets_left} / 2</span>
          </div>
        )}
      </div>

      <div className="price-divider" />

      {done ? (
        <p style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
          <CheckCircle2 size={16} style={{ color: "var(--blue)" }} /> Your PC was unlinked. Sign in from the new PC to link it.
        </p>
      ) : canConfirm ? (
        <>
          <p style={{ fontSize: 13, margin: "0 0 12px" }}>Email verified. Confirm to unlink your current PC.</p>
          <button className="button primary" style={{ width: "100%", fontSize: 13 }} onClick={confirmReset} disabled={busy}>
            {busy ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />} Confirm HWID reset
          </button>
        </>
      ) : sent ? (
        <p style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
          <Mail size={16} style={{ color: "var(--blue)" }} /> We emailed {user.email}. Open the link within 15 minutes to confirm.
        </p>
      ) : (
        <button
          className="button"
          style={{ width: "100%", fontSize: 13 }}
          onClick={sendEmail}
          disabled={busy || !status?.bound || status.resets_left < 1}
        >
          {busy ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />} Reset my HWID
        </button>
      )}
      {error && <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: "12px 0 0" }}>{error}</p>}
      {!done && !canConfirm && !sent && (
        <p className="small-note" style={{ marginTop: 10 }}>We&apos;ll email you a confirmation link before anything is unlinked.</p>
      )}
    </div>
  );
}
