import React from "react";
import {
  useTelemetryConnection,
  useMetric,
  usePowerKW,
  useHottestTemp,
  useStatuses,
} from "./TelemetryProvider.tsx";

/* ----------------- helpers ----------------- */
type Status = "ok" | "warn" | "fault" | "neutral";

function statusColor(s: Status) {
  switch (s) {
    case "ok": return "#21d07a";
    case "warn": return "#ffb020";
    case "fault": return "#ff4d4f";
    default: return "#65728a";
  }
}
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const fmt = (v?: number, d = 1) => (isNum(v) ? v.toFixed(d) : "—");

/* Convert four wheel speeds to a single KMH figure (avg of present wheels) */
function useVehicleSpeedKMH() {
  const fr = useMetric("Wheel Speed FR").value;
  const fl = useMetric("Wheel Speed FL").value;
  const rr = useMetric("Wheel Speed RR").value;
  const rl = useMetric("Wheel Speed RL").value;
  const vals = [fr, fl, rr, rl].filter(isNum) as number[];
  if (vals.length === 0) return undefined;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/* ----------------- tiny primitives ----------------- */
function Chip({ label }: { label: string }) {
  return <span className="f1-chip">{label}</span>;
}
function Dot({ s = "neutral" as Status }) {
  return <span className="f1-dot" style={{ background: statusColor(s) }} />;
}

/* radial gauge (0–100) */
function ArcGauge({
  value = 0,
  label,
  accent = "#21d07a",
}: {
  value?: number;
  label: string;
  accent?: string;
}) {
  const v = Math.max(0, Math.min(100, isNum(value) ? value : 0));
  const r = 38, c = 2 * Math.PI * r;
  const dash = (1 - v / 100) * c;
  return (
    <svg viewBox="0 0 100 100" className="f1-gauge">
      <circle cx="50" cy="50" r={r} className="g-bg" />
      <circle
        cx="50" cy="50" r={r}
        className="g-fg"
        stroke={accent}
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dash}
      />
      <text x="50" y="52" className="g-val">{fmt(value, 0)}</text>
      <text x="50" y="68" className="g-label">{label}</text>
    </svg>
  );
}

function BigStat({
  value, unit, label,
}: { value?: number; unit?: string; label: string }) {
  return (
    <div className="f1-big">
      <div className="f1-big__value">
        <span>{fmt(value, unit === "rpm" ? 0 : 1)}</span>
        {unit && <small>{unit}</small>}
      </div>
      <div className="f1-big__label">{label}</div>
    </div>
  );
}

function MiniCard({
  value, unit, label, status = "neutral",
}: { value?: number; unit?: string; label: string; status?: Status }) {
  return (
    <div className="f1-mini">
      <div className="f1-mini__top">
        <Dot s={status} />
        <span>{label}</span>
      </div>
      <div className="f1-mini__val">
        {fmt(value)} {unit ?? ""}
      </div>
    </div>
  );
}

/* ----------------- driver panel ----------------- */
function DriverPanel({
  title,
  accent = "#3bb6ff",
  mirror = false,
}: { title: string; accent?: string; mirror?: boolean }) {
  const soc = useMetric("SoC").value;
  const pack = usePowerKW();
  const hottest = useHottestTemp(); // {name,val}

  return (
    <div className={`f1-driver ${mirror ? "is-right" : ""}`}>
      <div className="f1-driver__hdr">
        <Chip label={title} />
      </div>

      {/* car silhouette placeholder */}
      <div className="f1-driver__car">
        <div className="car-sil" style={{ borderColor: accent }} />
      </div>

      <div className="f1-driver__gauges">
        <ArcGauge value={soc} label="SoC %" accent={accent} />
        <ArcGauge value={pack ? Math.min(100, (pack / 120) * 100) : 0} label="Power %" accent="#ffb020" />
        <ArcGauge value={hottest?.val ? Math.min(100, (hottest.val / 120) * 100) : 0} label="Temp %" accent="#ff4d4f" />
      </div>
    </div>
  );
}

/* ----------------- track/center ----------------- */
function TrackBoard() {
  const speed = useVehicleSpeedKMH();
  const pkw = usePowerKW();
  const rpm = useMetric("Motor Speed").value;
  const v = useMetric("DC Voltage").value;
  const a = useMetric("Battery Current").value;
  const hottest = useHottestTemp();

  return (
    <div className="f1-center">
      {/* simple abstract "track" */}
      <svg className="f1-track" viewBox="0 0 600 260" preserveAspectRatio="none">
        <path
          d="M30,200 C120,120 180,120 260,160 S420,200 560,120"
          fill="none"
          stroke="#314056"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M30,200 C120,120 180,120 260,160 S420,200 560,120"
          fill="none"
          stroke="#3bb6ff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 12"
        />
      </svg>

      <div className="f1-center__stats">
        <BigStat value={speed} unit="km/h" label="Vehicle Speed" />
        <BigStat value={pkw} unit="kW" label="Pack Power" />
        <BigStat value={rpm} unit="rpm" label="Motor Speed" />
      </div>

      <div className="f1-center__strip">
        <MiniCard value={v} unit="V" label="DC Voltage" />
        <MiniCard value={a} unit="A" label="Battery Current" />
        <MiniCard value={hottest?.val} unit="°C" label={hottest?.name ?? "Hottest Temp"} />
        <MiniCard value={useMetric("Brake Pressure Front").value} unit="bar" label="Brake F" />
        <MiniCard value={useMetric("Brake Pressure Rear").value} unit="bar" label="Brake R" />
        <MiniCard value={useMetric("DCL").value} unit="A" label="DCL (limit)" />
      </div>
    </div>
  );
}

/* ----------------- statuses row ----------------- */
function FooterStrip() {
  const statuses = useStatuses();
  const pill = (name: string) => {
    const s = (statuses[name] || "OK").toUpperCase();
    const state: Status = s === "FAULT" ? "fault" : s === "WARN" ? "warn" : "ok";
    return (
      <div className="f1-pill" key={name}>
        <Dot s={state} /> {name}
      </div>
    );
  };

  const items = [
    "NMT is Operational",
    "RTD Running",
    "VCU Error Present",
    "Wheel Speed FR",
    "Wheel Speed FL",
    "Wheel Speed RR",
    "Wheel Speed RL",
  ];

  return <div className="f1-footer">{items.map(pill)}</div>;
}

/* ----------------- page ----------------- */
const F1StyleDashboard: React.FC = () => {
  const connected = useTelemetryConnection();

  return (
    <div className="f1-root">
      <header className="f1-hdr">
        <div className="brand">WESMO • LIVE</div>
        <div className={`conn ${connected ? "is-ok" : "is-bad"}`}>
          <span className="conn__dot" />
          {connected ? "connected" : "disconnected"}
        </div>
      </header>

      <div className="f1-grid">
        {/* left driver */}
        <DriverPanel title="DRIVER • A" accent="#3bb6ff" />

        {/* center board */}
        <TrackBoard />

        {/* right driver */}
        <DriverPanel title="DRIVER • B" accent="#f7931a" mirror />
      </div>

      <FooterStrip />

      {/* styles kept co-located for simplicity */}
      <style>{`
        .f1-root { background:#0e1522; min-height:calc(100vh - 64px); color:#e6edf7; padding:16px 18px 24px; }
        .f1-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .brand { letter-spacing:.25em; font-weight:800; color:#8fb7ff; }
        .conn { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid #2b3951; background:#111a2b; color:#8ea1bf; }
        .conn.is-ok { border-color:#1f7b56; color:#a7ffcf; }
        .conn.is-ok .conn__dot { background:#21d07a; }
        .conn.is-bad { border-color:#7b1f1f; color:#ffb3b3; }
        .conn.is-bad .conn__dot { background:#ff4d4f; }
        .conn__dot { width:8px; height:8px; border-radius:50%; background:#65728a; }

        .f1-grid { display:grid; grid-template-columns: 260px 1fr 260px; gap:14px; }
        @media (max-width: 1280px) { .f1-grid { grid-template-columns: 1fr; } }

        .f1-driver { background:linear-gradient(180deg,#101a2c 0%,#0c1424 100%); border:1px solid #1f2a3e; border-radius:16px; padding:12px; display:flex; flex-direction:column; gap:10px; }
        .f1-driver__hdr { display:flex; justify-content:space-between; align-items:center; }
        .f1-chip { background:#162237; border:1px solid #24334d; color:#b8c7e4; font-weight:700; font-size:11px; padding:4px 8px; border-radius:999px; letter-spacing:.08em; }
        .f1-driver__car { display:flex; justify-content:center; align-items:center; height:180px; }
        .car-sil { width:120px; height:160px; border:2px solid #3bb6ff; border-radius:12px; filter:drop-shadow(0 0 16px rgba(59,182,255,.2)); }
        .f1-driver__gauges { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }

        .f1-gauge { width:100%; height:auto; }
        .g-bg { fill:none; stroke:#1f2a3e; stroke-width:10; }
        .g-fg { fill:none; stroke-width:10; stroke-linecap:round; transform:rotate(-90deg); transform-origin:50% 50%; }
        .g-val { font-size:16px; font-weight:800; text-anchor:middle; fill:#e6edf7; }
        .g-label { font-size:9px; text-anchor:middle; fill:#9bb0cf; letter-spacing:.08em; }

        .f1-center { background:linear-gradient(180deg,#101a2c 0%,#0c1424 100%); border:1px solid #1f2a3e; border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:12px; }
        .f1-track { width:100%; height:180px; background:radial-gradient(ellipse at 50% 60%, rgba(59,182,255,0.05) 0%, transparent 60%); border-radius:12px; }
        .f1-center__stats { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
        .f1-big { background:#0f1830; border:1px solid #1f2a3e; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:6px; }
        .f1-big__value { font-size:34px; font-weight:900; display:flex; align-items:flex-end; gap:6px; color:#e6edf7; }
        .f1-big__value small { font-size:14px; color:#9bb0cf; }
        .f1-big__label { font-size:11px; color:#8ea1bf; letter-spacing:.1em; text-transform:uppercase; }

        .f1-center__strip { display:grid; grid-template-columns: repeat(6, 1fr); gap:10px; }
        .f1-mini { background:#0f1830; border:1px solid #1f2a3e; border-radius:10px; padding:10px; }
        .f1-mini__top { display:flex; align-items:center; gap:8px; color:#9bb0cf; font-size:11px; }
        .f1-dot { width:8px; height:8px; border-radius:50%; background:#65728a; }
        .f1-mini__val { margin-top:6px; font-size:18px; font-weight:800; color:#e6edf7; }

        .f1-footer { margin-top:14px; display:flex; flex-wrap:wrap; gap:8px; }
        .f1-pill { background:#111a2b; border:1px solid #28354d; color:#b6c5e2; padding:6px 10px; border-radius:999px; font-size:12px; display:flex; align-items:center; gap:8px; }
      `}</style>
    </div>
  );
};

export default F1StyleDashboard;
