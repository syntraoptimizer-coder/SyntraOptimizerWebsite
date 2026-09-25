"use client";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

/**
 * Two-factor authentication. Two ways in, because not everyone wants an authenticator app:
 *
 *  • Email code — Supabase's own email OTP, sent through the project's SMTP (Resend) with the Magic
 *    Link template. Not an MFA factor type, so it cannot raise a session to aal2; the flag lives in
 *    public.security_prefs and enforcement reads the `otp` entry it leaves in the session's `amr`.
 *  • Authenticator app — a real Supabase TOTP factor. Raises the session to aal2 and comes with
 *    recovery codes.
 *
 * This card only lets people turn a factor on. Nothing here enforces one: an account without either
 * keeps working exactly as before. Enforcement comes later and has to, since requiring a second factor
 * before anyone can set one up would lock out every existing account.
 *
 * Turning email codes OFF re-asks for a code first. A password thief who could simply switch the
 * second factor off would face no second factor at all.
 */

type Enrolling = { factorId: string; qr: string; secret: string };
/** After the code is verified, email_2fa is set to `next`. Covers turning it on and off alike. */
type EmailStep = { next: boolean };
type View =
  | { step: "loading" }
  | { step: "off" }
  | { step: "enrolling"; data: Enrolling }
  | { step: "email"; data: EmailStep }
  | { step: "codes"; codes: string[] }
  | {
      step: "on";
      method: "totp";
      factorId: string;
      remaining: number | null;
      total: number | null;
    }
  | { step: "on"; method: "email" };

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
};
const label: CSSProperties = {
  color: "var(--muted-foreground)",
  flexShrink: 0,
};
const choice: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: 14,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--card)",
  textAlign: "left",
};

const message = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export default function TwoFactorCard({
  sb,
  user,
}: {
  sb: SupabaseClient;
  user: User;
}) {
  const [view, setView] = useState<View>({ step: "loading" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  /** Works out which view the account's current factors correspond to. Writes no state, so it is safe
   *  to call from an effect that may be cancelled. */
  const readFactors = useCallback(async (): Promise<{
    view: View;
    error: string;
  }> => {
    const { data, error: listError } = await sb.auth.mfa.listFactors();
    if (listError)
      return {
        view: { step: "off" },
        error: message(listError, "Could not read your security settings."),
      };

    const verified = data.totp[0];
    if (verified) {
      // getStatus() errors with mfa_factor_not_found when no codes were ever generated — not a
      // failure, just an account that enrolled before recovery codes existed.
      const { data: codes } = await sb.auth.mfa.recoveryCodes.getStatus();
      return {
        view: {
          step: "on",
          method: "totp",
          factorId: verified.id,
          remaining: codes?.remaining ?? null,
          total: codes?.total ?? null,
        },
        error: "",
      };
    }

    const { data: prefs } = await sb
      .from("security_prefs")
      .select("email_2fa")
      .eq("user_id", user.id)
      .maybeSingle();
    if (prefs?.email_2fa) return { view: { step: "on", method: "email" }, error: "" };

    return { view: { step: "off" }, error: "" };
  }, [sb, user.id]);

  /** The "go back to a known state" path after every action. */
  const load = useCallback(async () => {
    const result = await readFactors();
    setView(result.view);
    setError(result.error);
  }, [readFactors]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await readFactors();
      if (!active) return;
      setView(result.view);
      setError(result.error);
    })();
    return () => {
      active = false;
    };
  }, [readFactors]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(""), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  // ── Email codes ──────────────────────────────────────────────────────────

  /** Sends a code to the account's address. `next` is what email_2fa becomes once it is verified. */
  async function sendEmailCode(next: boolean) {
    if (!user.email) {
      setError("This account has no email address to send a code to.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: sendError } = await sb.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      });
      if (sendError) throw sendError;
      setCode("");
      setView({ step: "email", data: { next } });
    } catch (err) {
      setError(message(err, "Could not send the code. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmEmailCode(next: boolean) {
    if (code.length !== 6 || busy || !user.email) return;
    setBusy(true);
    setError("");
    try {
      // Verifying issues a fresh session carrying an `otp` entry in amr — both the proof that this
      // inbox is reachable and, when turning the factor off, what set_email_2fa() demands.
      const { error: verifyError } = await sb.auth.verifyOtp({
        email: user.email,
        token: code,
        type: "email",
      });
      if (verifyError) throw verifyError;
      const { error: rpcError } = await sb.rpc("set_email_2fa", {
        p_enabled: next,
      });
      if (rpcError) throw rpcError;
      await load();
    } catch (err) {
      setError(message(err, "That code didn't match. Check your inbox and try again."));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  // ── Authenticator app (TOTP) ─────────────────────────────────────────────

  async function startTotp() {
    setBusy(true);
    setError("");
    try {
      // An abandoned enrolment leaves an unverified factor behind, and the next enroll() is then
      // refused for a duplicate friendly name. Clear those out first.
      const { data: existing } = await sb.auth.mfa.listFactors();
      for (const factor of existing?.all ?? [])
        if (factor.status === "unverified")
          await sb.auth.mfa.unenroll({ factorId: factor.id });

      const { data, error: enrollError } = await sb.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (enrollError) throw enrollError;
      setCode("");
      setView({
        step: "enrolling",
        data: { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret },
      });
    } catch (err) {
      setError(message(err, "Could not start setup. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmTotp(factorId: string) {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: verifyError } = await sb.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (verifyError) throw verifyError;
    } catch (err) {
      setError(
        message(err, "That code didn't match. Check your authenticator and try again."),
      );
      setCode("");
      setBusy(false);
      return;
    }

    // Past this point the factor is enrolled and the session is aal2. Anything that fails now is
    // about the recovery codes, not about the digits just typed — reporting "that didn't match"
    // would be untrue, and would hide the fact that two-factor is already switched on.
    try {
      const { data, error: codesError } = await sb.auth.mfa.recoveryCodes.generate();
      if (codesError) throw codesError;
      setView({ step: "codes", codes: data.codes });
    } catch (err) {
      await load();
      setError(
        message(err, "Two-factor is on, but your recovery codes could not be generated.") +
          " Use \"Generate codes\" below: without them, losing your phone means losing the account.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function turnOffTotp(factorId: string) {
    setBusy(true);
    setError("");
    try {
      const { error: offError } = await sb.auth.mfa.unenroll({ factorId });
      if (offError) throw offError;
      await load();
    } catch (err) {
      setError(message(err, "Could not turn two-factor off."));
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    setError("");
    try {
      const { data, error: genError } = await sb.auth.mfa.recoveryCodes.regenerate();
      if (genError) throw genError;
      setView({ step: "codes", codes: data.codes });
    } catch (err) {
      setError(message(err, "Could not generate new recovery codes."));
    } finally {
      setBusy(false);
    }
  }

  // ── Shared helpers ───────────────────────────────────────────────────────

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // The clipboard can be refused (no gesture, insecure origin). The value is on screen anyway.
    }
  }

  function download(codes: string[]) {
    const body = [
      "Velyro Optimizer — two-factor recovery codes",
      `Account: ${user.email ?? user.id}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Each code works once. Keep them somewhere you can reach without this PC.",
      "",
      ...codes,
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "velyro-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  /** The six-digit box, shared by both methods. */
  const codeField = (onSubmit: () => void) => (
    <label className="email-field" style={{ margin: 0 }}>
      <KeyRound size={15} />
      <input
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit();
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        aria-label="Six-digit code"
        style={{ letterSpacing: "0.3em", fontFamily: "GeistMono, monospace" }}
      />
    </label>
  );

  return (
    <div className="price-card device-card" style={{ marginBottom: 24 }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}
      >
        <div className="device-emblem">
          <ShieldCheck size={17} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 550, margin: 0 }}>
            Two-factor authentication
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              margin: "2px 0 0",
            }}
          >
            A second check when you sign in, on top of your password.
          </p>
        </div>
      </div>

      {view.step === "loading" && (
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, ...label }}
        >
          <Loader2 size={14} className="spin" /> Checking…
        </div>
      )}

      {view.step === "off" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
          <div style={{ ...row, marginBottom: 4 }}>
            <span style={label}>Status</span>
            <strong>Off</strong>
          </div>
          <button
            type="button"
            style={choice}
            onClick={() => void sendEmailCode(true)}
            disabled={busy}
          >
            <Mail size={18} style={{ color: "var(--blue)", flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <strong style={{ display: "block", fontWeight: 550 }}>
                Email me a code
              </strong>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                Sent to {user.email ?? "your address"}. Nothing to install.
              </span>
            </span>
            {busy && <Loader2 size={14} className="spin" />}
          </button>
          <button type="button" style={choice} onClick={startTotp} disabled={busy}>
            <Smartphone size={18} style={{ color: "var(--blue)", flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <strong style={{ display: "block", fontWeight: 550 }}>
                Authenticator app
              </strong>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                Google Authenticator, Authy, 1Password. Stronger, works offline.
              </span>
            </span>
          </button>
        </div>
      )}

      {view.step === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            We sent a six-digit code to{" "}
            <strong style={{ color: "var(--foreground)" }}>{user.email}</strong>. Enter it
            below to {view.data.next ? "turn email codes on" : "turn email codes off"}.
          </p>
          {codeField(() => void confirmEmailCode(view.data.next))}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="button"
              style={{ flex: 1 }}
              onClick={() => void confirmEmailCode(view.data.next)}
              disabled={busy || code.length !== 6}
            >
              {busy ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Verify
            </button>
            <button
              type="button"
              className="button"
              onClick={() => void load()}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
          <button
            type="button"
            className="small-note"
            style={{
              background: "none",
              border: 0,
              letterSpacing: 0,
              textAlign: "left",
            }}
            onClick={() => void sendEmailCode(view.data.next)}
            disabled={busy}
          >
            Didn&apos;t get it? Send another code.
          </button>
        </div>
      )}

      {view.step === "enrolling" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            Scan this with your authenticator app, then enter the six digits it shows.
          </p>
          {/* Supabase returns the QR as an inline SVG data URI, so it renders without a QR
              library — and there is nothing for next/image to fetch, resize or cache. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={view.data.qr}
            alt="Two-factor setup QR code"
            width={180}
            height={180}
            style={{
              alignSelf: "center",
              background: "#fff",
              padding: 10,
              borderRadius: 10,
            }}
          />
          <div style={row}>
            <span style={label}>Can&apos;t scan?</span>
            <span className="device-hwid">
              <code>{view.data.secret}</code>
              <button
                type="button"
                className="device-hwid-action"
                onClick={() => copy(view.data.secret, "secret")}
                aria-label="Copy setup key"
              >
                {copied === "secret" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </span>
          </div>
          {codeField(() => void confirmTotp(view.data.factorId))}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="button"
              style={{ flex: 1 }}
              onClick={() => void confirmTotp(view.data.factorId)}
              disabled={busy || code.length !== 6}
            >
              {busy ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Verify
            </button>
            <button
              type="button"
              className="button"
              onClick={() => void load()}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {view.step === "codes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--foreground)" }}>Save these now.</strong> They are
            shown once and cannot be retrieved again. Each one works a single time, and they
            are the only way back into your account if you lose your phone.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
              padding: 16,
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "var(--muted)",
              fontFamily: "GeistMono, monospace",
              fontSize: 13,
            }}
          >
            {view.codes.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="button"
              style={{ flex: 1 }}
              onClick={() => download(view.codes)}
            >
              <Download size={14} /> Download
            </button>
            <button
              type="button"
              className="button"
              style={{ flex: 1 }}
              onClick={() => copy(view.codes.join("\n"), "codes")}
            >
              {copied === "codes" ? <Check size={14} /> : <Copy size={14} />} Copy
            </button>
          </div>
          <button type="button" className="button" onClick={() => void load()}>
            I&apos;ve saved them
          </button>
        </div>
      )}

      {view.step === "on" && view.method === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
          <div style={row}>
            <span style={label}>Status</span>
            <strong style={{ color: "var(--success)" }}>On — email code</strong>
          </div>
          <div style={row}>
            <span style={label}>Codes go to</span>
            <span style={{ overflowWrap: "anywhere" }}>{user.email}</span>
          </div>
          <p
            className="small-note"
            style={{ margin: "4px 0 0", letterSpacing: 0, lineHeight: 1.5 }}
          >
            An authenticator app is stronger: a code in your inbox protects you only as well
            as the inbox itself. Turn this off first if you want to switch.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="button"
              style={{ flex: 1 }}
              onClick={() => void sendEmailCode(false)}
              disabled={busy}
            >
              {busy ? <Loader2 size={14} className="spin" /> : null} Turn off
            </button>
          </div>
        </div>
      )}

      {view.step === "on" && view.method === "totp" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
          <div style={row}>
            <span style={label}>Status</span>
            <strong style={{ color: "var(--success)" }}>On — authenticator app</strong>
          </div>
          <div style={row}>
            <span style={label}>Recovery codes</span>
            <span>
              {view.remaining == null
                ? "None generated"
                : `${view.remaining} of ${view.total} left`}
            </span>
          </div>
          {view.remaining === 0 && (
            <p
              className="small-note"
              style={{ margin: 0, color: "var(--blue)", letterSpacing: 0 }}
            >
              Every code has been used. Generate a new set while you still have your
              authenticator.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="button"
              style={{ flex: 1 }}
              onClick={regenerate}
              disabled={busy}
            >
              {busy ? <Loader2 size={14} className="spin" /> : <KeyRound size={14} />}
              {view.remaining == null ? "Generate codes" : "New codes"}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => void turnOffTotp(view.factorId)}
              disabled={busy}
            >
              Turn off
            </button>
          </div>
        </div>
      )}

      {error && (
        <>
          <div className="price-divider" />
          <p role="alert" style={{ fontSize: 13, color: "var(--blue)", margin: 0 }}>
            {error}
          </p>
        </>
      )}
    </div>
  );
}
