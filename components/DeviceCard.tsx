"use client";
import { useEffect, useState, type CSSProperties } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Check, Copy, Eye, EyeOff, Monitor } from "lucide-react";

type Status = { bound: boolean; hwid: string | null; linked_at: string | null; last_seen: string | null };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

/** Keeps the ends, hides the middle: enough to tell two PCs apart at a glance without putting the whole
 *  value on screen. The hwid is what claim_device() checks, so a screenshot of it is worth something. */
function mask(hwid: string) {
  if (hwid.length <= 14) return hwid;
  return `${hwid.slice(0, 8)}${"•".repeat(12)}${hwid.slice(-4)}`;
}

const row: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16 };
const label: CSSProperties = { color: "var(--muted-foreground)", flexShrink: 0 };

/**
 * Read-only view of the PC a license is bound to.
 *
 * The self-service HWID reset was removed: customers can see their linked PC but not unbind it. The
 * capability is revoked in the database too (supabase/migrations/005_device_readonly.sql) — taking the
 * button away would not have stopped anyone calling the RPC straight from a browser console.
 */
export default function DeviceCard({ sb, user }: { sb: SupabaseClient; user: User }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await sb.rpc("device_status");
      if (active && !error) setStatus(data as Status);
    })();
    return () => {
      active = false;
    };
  }, [sb]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    if (!status?.hwid) return;
    try {
      await navigator.clipboard.writeText(status.hwid);
      setCopied(true);
    } catch {
      // The clipboard can be refused (no gesture, insecure origin); revealing the value still works.
      setRevealed(true);
    }
  }

  return (
    <div className="price-card device-card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div className="device-emblem">
          <Monitor size={17} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 550, margin: 0 }}>Linked PC</h3>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "2px 0 0" }}>
            Your license is tied to one PC, identified by its hardware ID (HWID).
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
        <div style={row}>
          <span style={label}>Status</span>
          <strong>{status ? (status.bound ? "PC linked" : "No PC linked yet") : "…"}</strong>
        </div>
        {status?.bound && (
          <>
            {status.hwid && (
              <div style={row}>
                <span style={label}>Hardware ID</span>
                <span className="device-hwid">
                  <code>{revealed ? status.hwid : mask(status.hwid)}</code>
                  <button
                    type="button"
                    className="device-hwid-action"
                    onClick={() => setRevealed((value) => !value)}
                    aria-label={revealed ? "Hide hardware ID" : "Reveal hardware ID"}
                  >
                    {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className="device-hwid-action"
                    onClick={copy}
                    aria-label="Copy hardware ID"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
            )}
            <div style={row}>
              <span style={label}>Linked on</span>
              <span>{fmt(status.linked_at)}</span>
            </div>
            <div style={row}>
              <span style={label}>Last seen</span>
              <span>{fmt(status.last_seen)}</span>
            </div>
          </>
        )}
      </div>

      <div className="price-divider" />

      <p className="small-note" style={{ margin: 0 }}>
        {status?.bound
          ? `Linked to ${user.email ?? "your account"}. This link is permanent: if you change PC, a new license has to be purchased.`
          : "Sign in from the Velyro Optimizer app on the PC you want to use. That PC will be linked permanently, so make sure it's the one you'll keep using."}
      </p>
    </div>
  );
}
