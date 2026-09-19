"use client";
import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

type Mode = "signin" | "signup" | "forgot" | "link" | "recovery";

const MIN_PASSWORD = 8;
const labelStyle = { fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500 } as const;
const linkButton = { background: "none", border: 0, padding: 0, color: "var(--blue)", fontSize: 12, cursor: "pointer" } as const;

/**
 * Email + password sign-in (like the desktop app), with account creation, "forgot password", and — as a secondary
 * option — the one-time email link. `recovering` opens the "choose a new password" step after the reset email link.
 */
export default function EmailPasswordForm({
  sb,
  recovering = false,
  onDone,
}: {
  sb: SupabaseClient;
  recovering?: boolean;
  onDone?: () => void;
}) {
  const [mode, setMode] = useState<Mode>(recovering ? "recovery" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [prevRecovering, setPrevRecovering] = useState(recovering);
  if (recovering !== prevRecovering) {
    setPrevRecovering(recovering);
    if (recovering) setMode("recovery");
  }

  const go = (next: Mode) => { setMode(next); setMessage(null); setPassword(""); setConfirm(""); };
  const ok = (text: string) => setMessage({ ok: true, text });
  const fail = (text: string) => setMessage({ ok: false, text });
  const origin = () => window.location.origin;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if ((mode === "signup" || mode === "recovery") && password.length < MIN_PASSWORD)
      return fail(`Use at least ${MIN_PASSWORD} characters for your password.`);
    if ((mode === "signup" || mode === "recovery") && password !== confirm)
      return fail("The two passwords don’t match.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (/not confirmed/i.test(error.message)) return fail("Please confirm your email first — check your inbox.");
          if (error.status === 429) return fail("Too many attempts. Please wait a moment.");
          return fail("Incorrect email or password.");
        }
        onDone?.();
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${origin()}/account` },
        });
        if (error) return fail(error.status === 429 ? "Too many attempts. Please wait a moment." : error.message);
        if (data.user && data.user.identities?.length === 0) return fail("An account with this email already exists. Sign in instead.");
        if (data.session) onDone?.();
        else ok("Account created. Check your inbox to confirm your email, then sign in.");
      } else if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin()}/login` });
        if (error && error.status === 429) return fail("An email was just sent. Wait a minute before asking again.");
        ok("If an account exists for this email, we sent a link to reset your password.");
      } else if (mode === "link") {
        const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${origin()}/account` } });
        if (error) return fail(error.status === 429 ? "An email was just sent. Wait a minute before asking again." : "We couldn’t send the link. Check your email address.");
        ok("Check your inbox for a secure sign-in link.");
      } else {
        const { error } = await sb.auth.updateUser({ password });
        if (error) return fail("Your password could not be updated. Open the reset link from your email again.");
        ok("Password updated. You’re signed in.");
        onDone?.();
      }
    } finally {
      setBusy(false);
    }
  }

  const needsEmail = mode !== "recovery";
  const needsPassword = mode === "signin" || mode === "signup" || mode === "recovery";
  const needsConfirm = mode === "signup" || mode === "recovery";
  const title = { signin: "Sign in", signup: "Create your account", forgot: "Reset your password", link: "Sign in with an email link", recovery: "Choose a new password" }[mode];
  const button = { signin: "Sign in", signup: "Create account", forgot: "Send reset link", link: "Email me a sign-in link", recovery: "Save new password" }[mode];
  const autoPassword = mode === "signin" ? "current-password" : "new-password";

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      <strong style={{ fontSize: 14, fontWeight: 560 }}>{title}</strong>

      {needsEmail && (
        <>
          <label htmlFor="ep-email" style={labelStyle}>Email address</label>
          <div className="email-field">
            <Mail size={15} />
            <input id="ep-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} />
          </div>
        </>
      )}

      {needsPassword && (
        <>
          <label htmlFor="ep-password" style={labelStyle}>{mode === "recovery" ? "New password" : "Password"}</label>
          <div className="email-field">
            <Lock size={15} />
            <input id="ep-password" type={show ? "text" : "password"} autoComplete={autoPassword} placeholder={mode === "signin" ? "Your password" : `At least ${MIN_PASSWORD} characters`} value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={512} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--muted-foreground)", display: "grid", placeItems: "center" }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </>
      )}

      {needsConfirm && (
        <>
          <label htmlFor="ep-confirm" style={labelStyle}>Confirm password</label>
          <div className="email-field">
            <Lock size={15} />
            <input id="ep-confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={512} />
          </div>
        </>
      )}

      <button type="submit" className="button primary" style={{ width: "100%", fontSize: 13 }} disabled={busy}>
        {busy ? "Please wait…" : button} <ArrowRight size={14} />
      </button>

      {message && (
        <p role={message.ok ? "status" : "alert"} style={{ margin: 0, fontSize: 13, color: message.ok ? "var(--foreground)" : "#dc2626" }}>{message.text}</p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        {mode === "signin" && (
          <>
            <button type="button" style={linkButton} onClick={() => go("forgot")}>Forgot password?</button>
            <button type="button" style={linkButton} onClick={() => go("signup")}>Create an account</button>
          </>
        )}
        {mode === "signup" && <button type="button" style={linkButton} onClick={() => go("signin")}>I already have an account</button>}
        {(mode === "forgot" || mode === "link") && <button type="button" style={linkButton} onClick={() => go("signin")}>Back to sign in</button>}
        {mode === "signin" && <button type="button" style={linkButton} onClick={() => go("link")}>Email me a sign-in link instead</button>}
      </div>
    </form>
  );
}
