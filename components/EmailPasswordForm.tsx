"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, CheckCircle2, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

type Mode = "signin" | "signup" | "forgot" | "link" | "recovery";

const MIN_PASSWORD = 8;

const HEADINGS: Record<Exclude<Mode, "signin" | "signup">, { title: string; text: string }> = {
  forgot: { title: "Reset your password", text: "Enter your email and we’ll send you a link to choose a new password." },
  link: { title: "Sign in with an email link", text: "We’ll email you a one-time link — no password needed." },
  recovery: { title: "Choose a new password", text: "Pick a new password for your Syntra account." },
};
const SUBMIT: Record<Mode, string> = {
  signin: "Sign in",
  signup: "Create account",
  forgot: "Send reset link",
  link: "Email me a sign-in link",
  recovery: "Save new password",
};

function Field({ id, label, action, icon, children }: { id: string; label: string; action?: ReactNode; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="ep-field">
      <div className="ep-label">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="ep-input">
        {icon}
        {children}
      </div>
    </div>
  );
}

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

  const tabbed = mode === "signin" || mode === "signup";
  const needsEmail = mode !== "recovery";
  const needsPassword = mode === "signin" || mode === "signup" || mode === "recovery";
  const needsConfirm = mode === "signup" || mode === "recovery";
  const heading = tabbed ? null : HEADINGS[mode];
  const eye = (
    <button type="button" className="ep-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <form onSubmit={submit} className="ep-form" noValidate={false}>
      {tabbed ? (
        <div className="ep-tabs" role="tablist" aria-label="Email sign-in">
          <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "on" : ""} onClick={() => go("signin")}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => go("signup")}>Create account</button>
        </div>
      ) : (
        heading && (
          <div className="ep-head">
            {mode !== "recovery" && <button type="button" className="ep-back" onClick={() => go("signin")}>← Back to sign in</button>}
            <h3>{heading.title}</h3>
            <p>{heading.text}</p>
          </div>
        )
      )}

      {needsEmail && (
        <Field id="ep-email" label="Email address" icon={<Mail size={16} />}>
          <input id="ep-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} />
        </Field>
      )}

      {needsPassword && (
        <Field
          id="ep-password"
          label={mode === "recovery" ? "New password" : "Password"}
          icon={<Lock size={16} />}
          action={mode === "signin" ? <button type="button" className="ep-link" onClick={() => go("forgot")}>Forgot password?</button> : undefined}
        >
          <input id="ep-password" type={show ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Your password" : `At least ${MIN_PASSWORD} characters`} value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={512} />
          {eye}
        </Field>
      )}

      {needsConfirm && (
        <Field id="ep-confirm" label="Confirm password" icon={<Lock size={16} />}>
          <input id="ep-confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={512} />
        </Field>
      )}

      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "ep-msg ok" : "ep-msg err"}>
          {message.ok ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          <span>{message.text}</span>
        </p>
      )}

      <button type="submit" className="button primary ep-submit" disabled={busy}>
        {busy ? <Loader2 size={16} className="spin" /> : null}
        {busy ? "Please wait…" : SUBMIT[mode]}
        {!busy && <ArrowRight size={15} />}
      </button>

      {mode === "signin" && (
        <button type="button" className="ep-alt" onClick={() => go("link")}>Email me a sign-in link instead</button>
      )}
    </form>
  );
}
