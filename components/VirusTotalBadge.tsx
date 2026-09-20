import { ArrowUpRight, ShieldCheck } from "lucide-react";

/**
 * Result of the VirusTotal scan of the published installer. It is tied to ONE file (its SHA-256): after
 * publishing a new installer, upload it to VirusTotal and update the four constants below.
 */
const SCAN = {
  fileName: "Velyro Optimizer Setup 1.0.0.exe",
  sha256: "95833c3113c435318be5e3aca015411179bcfa4b255a1f79ff0bceca54db2708",
  flagged: 0,
  vendors: 66,
  scannedOn: "September 19, 2026",
};
const REPORT_URL = `https://www.virustotal.com/gui/file/${SCAN.sha256}/detection`;

export default function VirusTotalBadge() {
  const clean = SCAN.flagged === 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const share = SCAN.flagged / SCAN.vendors;
  return (
    <div className="vt-card reveal">
      <div className={clean ? "vt-gauge clean" : "vt-gauge flagged"} role="img" aria-label={`${SCAN.flagged} of ${SCAN.vendors} security vendors flagged this file`}>
        <svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} className="vt-track" />
          <circle
            cx="50" cy="50" r={radius} className="vt-arc"
            strokeDasharray={`${Math.max(share, clean ? 1 : 0) * circumference} ${circumference}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="vt-score"><strong>{SCAN.flagged}</strong><span>/ {SCAN.vendors}</span></div>
      </div>
      <div className="vt-body">
        <p className="vt-eyebrow"><ShieldCheck size={14} /> Independently scanned</p>
        <h3>{clean ? "No security vendors flagged this file as malicious." : `${SCAN.flagged} security vendors flagged this file.`}</h3>
        <p className="vt-meta">
          {SCAN.fileName} · scanned {SCAN.scannedOn} by {SCAN.vendors} antivirus engines on
        </p>
        <a className="vt-logo-link" href={REPORT_URL} target="_blank" rel="noopener noreferrer" aria-label="Open the full VirusTotal report">
          <img src="/assets/virustotal-logo.svg" alt="VirusTotal" height="22" />
        </a>
        <p className="vt-hash" title="SHA-256 of the scanned installer">SHA-256 {SCAN.sha256}</p>
      </div>
      <a className="button" href={REPORT_URL} target="_blank" rel="noopener noreferrer">
        View full report <ArrowUpRight size={14} />
      </a>
    </div>
  );
}
