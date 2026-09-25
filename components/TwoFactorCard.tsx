"use client";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";

/**
 * Two-factor authentication (TOTP) enrolment.
 *
 * This card only lets people *turn 2FA on*. Nothing here enforces it: a session without a factor stays
 * at aal1 and keeps working exactly as before. Enforcement is a separate, later step — requiring aal2
 * before anyone is able to enrol would lock out every existing account, this one included.
 *
 * Recovery codes are generated as part of switching it on, not as an afterthought. A Velyro licence is
 * bound permanently to one PC (supabase/migrations/005_device_readonly.sql), so a customer who loses
 * their authenticator with no code to fall back on has no self-service way back in.
 */

type Enrolling = { factorId: string; qr: string; secret: string };
type View =
  | { step: "loading" }
  | { step: "off" }
  | { step: "enrolling"; data: Enrolling }
  | { step: "codes"; codes: string[]; factorId: string }
  | {
      step: "on";
      factorId: string;
      remaining: number | null;
      total: number | null;
    };

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
};
const label: CSSProperties = {
  color: "var(--muted-foreground)",
  flexShrink: 0,
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

  /** Works out which view the account's factors correspond to. Writes no state, so it is safe to call
   *  from an effect that may be cancelled. */
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
    if (!verified) return { view: { step: "off" }, error: "" };
    // getStatus() errors with mfa_factor_not_found when no codes were ever generated — not a failure,
    // just an account that enrolled before recovery codes existed.
    const { data: codes } = await sb.auth.mfa.recoveryCodes.getStatus();
    return {
      view: {
        step: "on",
        factorId: verified.id,
        remaining: codes?.remaining ?? null,
        total: codes?.total ?? null,
      },
      error: "",
    };
  }, [sb]);

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

  async function start() {
    setBusy(true);
    setError("");
    try {
      // An abandoned enrolment leaves an unverified factor behind, and the next enroll() is then refused
      // for a duplicate friendly name. Clear those out first.
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
        data: {
          factorId: data.id,
          qr: data.totp.qr_code,
          secret: data.totp.secret,
        },
      });
    } catch (err) {
      setError(message(err, "Could not start setup. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(factorId: string) {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error: verifyError } = await sb.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (verifyError) throw verifyError;
      // The session is now aal2, which is what generating recovery codes requires.
      const { data, error: codesError } =
        await sb.auth.mfa.recoveryCodes.generate();
      if (codesError) throw codesError;
      setView({ step: "codes", codes: data.codes, factorId });
    } catch (err) {
      setError(
        message(
          err,
          "That code didn't match. Check your authenticator and try again.",
        ),
      );
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff(factorId: string) {
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
      const { data, error: genError } =
        await sb.auth.mfa.recoveryCodes.regenerate();
      if (genError) throw genError;
      setView((current) =>
        current.step === "on"
          ? { step: "codes", codes: data.codes, factorId: current.factorId }
          : current,
      );
    } catch (err) {
      setError(message(err, "Could not generate new recovery codes."));
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // The clipboard can be refused (no gesture, insecure origin). The value is on screen either way.
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

  return (
    <div className="price-card device-card" style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
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
            A code from your phone, on top of your password.
          </p>
        </div>
      </div>

      {view.step === "loading" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            ...label,
          }}
        >
          <Loader2 size={14} className="spin" /> Checking…
        </div>
      )}

      {view.step === "off" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            fontSize: 13,
          }}
        >
          <div style={row}>
            <span style={label}>Status</span>
            <strong>Off</strong>
          </div>
          <button
            type="button"
            className="button"
            onClick={start}
            disabled={busy}
          >
            {busy ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <KeyRound size={14} />
            )}{" "}
            Turn on
          </button>
        </div>
      )}

      {view.step === "enrolling" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            fontSize: 13,
          }}
        >
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            Scan this with Google Authenticator, Authy, 1Password or any other
            authenticator app, then enter the six digits it shows.
          </p>
          {/* Supabase returns the QR as an inline SVG data URI, so it renders without a QR library —
              and there is nothing for next/image to fetch, resize or cache. */}
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
          <label className="email-field" style={{ margin: 0 }}>
            <KeyRound size={15} />
            <input
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") void confirm(view.data.factorId);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              aria-label="Six-digit code"
              style={{
                letterSpacing: "0.3em",
                fontFamily: "GeistMono, monospace",
              }}
            />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="button"
              style={{ flex: 1 }}
              onClick={() => void confirm(view.data.factorId)}
              disabled={busy || code.length !== 6}
            >
              {busy ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <Check size={14} />
              )}{" "}
              Verify
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            fontSize: 13,
          }}
        >
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--foreground)" }}>
              Save these now.
            </strong>{" "}
            They are shown once and cannot be retrieved again. Each one works a
            single time, and they are the only way back into your account if you
            lose your phone.
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
              {copied === "codes" ? <Check size={14} /> : <Copy size={14} />}{" "}
              Copy
            </button>
          </div>
          <button type="button" className="button" onClick={() => void load()}>
            I&apos;ve saved them
          </button>
        </div>
      )}

      {view.step === "on" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 13,
          }}
        >
          <div style={row}>
            <span style={label}>Status</span>
            <strong style={{ color: "var(--success)" }}>On</strong>
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
              Every code has been used. Generate a new set while you still have
              your authenticator.
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
              {busy ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <KeyRound size={14} />
              )}
              {view.remaining == null ? "Generate codes" : "New codes"}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => void turnOff(view.factorId)}
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
          <p
            role="alert"
            style={{ fontSize: 13, color: "var(--blue)", margin: 0 }}
          >
            {error}
          </p>
        </>
      )}
    </div>
  );
}
