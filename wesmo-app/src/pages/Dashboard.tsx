import React from "react";
import {
  TelemetryProvider,
  useTelemetryConnection,
  useMetric,
  usePowerKW,
  useHottestTemp,
  useFaults,
  useStatuses,
} from "../components/dashboard/TelemetryProvider.tsx";

import ModernDashboard from "../components/dashboard/ModernDashboard.tsx";


// Simple UI-side thresholds (tweak to taste)
const UI_THRESHOLDS = {
  SoC: { warnLow: 20, faultLow: 10 },            // %  (orange <20, red <10)
  PackPowerKW: { warnHigh: 70, faultHigh: 80 },  // kW (orange >70, red >80)
};

/* ---------- Small UI primitives ---------- */
type HealthDotProps = { state: "ok" | "warn" | "fault" | "neutral" };
function HealthDot({ state }: HealthDotProps) {
  return <span className={`health-dot ${state}`} aria-hidden />;
}

function Card({
  label,
  value,
  unit,
  status = "neutral",
}: {
  label: string;
  value?: number;
  unit?: string;
  status?: "ok" | "warn" | "fault" | "neutral";
}) {
  const display =
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—";
  return (
    <div className="card">
      <div className="card-label">
        <HealthDot state={status} /> {label}
      </div>
      <div className="card-value">
        {display} {unit ?? ""}
      </div>
    </div>
  );
}

function AlertsPanel() {
  const faults = useFaults();
  const recent = [...faults].slice(-8).reverse();

  const dot = (s: string) =>
    s.startsWith("FAULT") ? "dot dot-fault" :
    s.startsWith("WARN")  ? "dot dot-warn"  :
    "dot dot-ok";

  return (
    <div className="panel">
      <div className="panel-title">Alerts</div>
      {recent.length === 0 ? (
        <div className="panel-empty">No alerts.</div>
      ) : (
        recent.map((e, i) => (
          <div className="alert-row" key={i}>
            <span className={dot(e.status)} />
            <span className="alert-time">{new Date(e.ts).toLocaleTimeString()}</span>
            <strong className="alert-name">{e.name}</strong>
            <span className="alert-msg">{e.message ?? e.status} {Number.isFinite(e.value) ? `(val ${e.value})` : ""}</span>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------- Health resolution helpers ---------- */
function useHealth(keys: string[] | undefined) {
  const statusMap = useStatuses();
  if (!keys || keys.length === 0) return "neutral" as const;

  // worst-of aggregation across related metrics
  let state: "ok" | "warn" | "fault" = "ok";
  for (const k of keys) {
    const s = statusMap[k];
    if (s === "FAULT") return "fault";
    if (s === "WARN") state = "warn";
  }
  return state;
}

/* ---------- Section rows ---------- */
function RowPowertrain() {
  const soc = useMetric("SoC");
  const v = useMetric("DC Voltage");
  const a = useMetric("Battery Current");
  const dcl = useMetric("DCL");
  const pkw = usePowerKW();
  const hottest = useHottestTemp();

  const stVoltage = useHealth(["Battery Voltage"]);
  const stCurrent = useHealth(["Battery Current"]);
  const stTemp    = useHealth(["Motor Temperature"]);

  // NEW: SoC + Pack Power lights
  const stSoC =
    Number.isFinite(soc.value)
      ? (soc.value! < UI_THRESHOLDS.SoC.faultLow ? "fault"
         : soc.value! < UI_THRESHOLDS.SoC.warnLow ? "warn" : "ok")
      : "neutral";

  const stPack =
    Number.isFinite(pkw)
      ? (pkw! > UI_THRESHOLDS.PackPowerKW.faultHigh ? "fault"
         : pkw! > UI_THRESHOLDS.PackPowerKW.warnHigh ? "warn" : "ok")
      : "neutral";

  return (
    <>
      <h3 className="section">Powertrain & Energy</h3>
      <div className="grid">
        <Card label="SoC"        value={soc.value} unit={soc.unit ?? "%"}  status={stSoC} />
        <Card label="Pack Power" value={pkw}       unit="kW"               status={stPack} />
        <Card label="DC Voltage" value={v.value}   unit={v.unit ?? "V"}    status={stVoltage} />
        <Card label="Battery Current" value={a.value} unit={a.unit ?? "A"} status={stCurrent} />
        <Card label={hottest.name ?? "Motor Temp"}  value={hottest.val} unit="°C" status={stTemp} />
        <Card label="DCL (limit)" value={dcl.value} unit={dcl.unit ?? "A"} status="neutral" />
      </div>
    </>
  );
}

function RowDynamics() {
  const rpm = useMetric("Motor Speed");
  const fr  = useMetric("Wheel Speed FR");
  const fl  = useMetric("Wheel Speed FL");
  const rr  = useMetric("Wheel Speed RR");
  const rl  = useMetric("Wheel Speed RL");
  const bpf = useMetric("Brake Pressure Front");
  const bpr = useMetric("Brake Pressure Rear");

  const stRPM  = useHealth(["Motor Speed"]);
  const stBPF  = useHealth(["Brake Pressure Front"]);
  const stBPR  = useHealth(["Brake Pressure Rear"]);
  const stFR   = useHealth(["Wheel Speed FR"]);
  const stFL   = useHealth(["Wheel Speed FL"]);
  const stRR   = useHealth(["Wheel Speed RR"]);
  const stRL   = useHealth(["Wheel Speed RL"]);

  return (
    <>
      <h3 className="section">Dynamics</h3>
      <div className="grid">
        <Card label="Motor Speed" value={rpm.value} unit={rpm.unit ?? "rpm"} status={stRPM} />
        <Card label="Brake Pressure Front" value={bpf.value} unit={bpf.unit ?? "bar"} status={stBPF} />
        <Card label="Brake Pressure Rear"  value={bpr.value} unit={bpr.unit ?? "bar"} status={stBPR} />
        <Card label="Wheel Speed FR" value={fr.value} unit={fr.unit ?? "km/h"} status={stFR} />
        <Card label="Wheel Speed FL" value={fl.value} unit={fl.unit ?? "km/h"} status={stFL} />
        <Card label="Wheel Speed RR" value={rr.value} unit={rr.unit ?? "km/h"} status={stRR} />
        <Card label="Wheel Speed RL" value={rl.value} unit={rl.unit ?? "km/h"} status={stRL} />
      </div>
    </>
  );
}

function RowStatuses() {
  const nmt = useMetric("NMT is Operational");
  const rtd = useMetric("RTD Running");
  const err = useMetric("VCU Error Present");

  return (
    <>
      <h3 className="section">Statuses</h3>
      <div className="grid">
        <Card label="NMT Operational" value={nmt.value} status="neutral" />
        <Card label="RTD Running"    value={rtd.value} status="neutral" />
        <Card label="VCU Error"      value={err.value} status="neutral" />
      </div>
    </>
  );
}

/* ---------- Page ---------- */
function DashboardInner() {
  const connected = useTelemetryConnection();

  return (
    <div className="dash-root">
      <header className="dash-header">
        <h2 className="dash-title">Live Telemetry</h2>
        <span className={`status ${connected ? "ok" : "bad"}`}>
          <span className="status-dot" />
          {connected ? "connected" : "disconnected"}
        </span>
      </header>

      <div className="top-row">
        <AlertsPanel />
      </div>

      <RowPowertrain />
      <RowDynamics />
      <RowStatuses />

      {/* Inline styles to keep this file self-contained */}
      <style>{`
        .dash-root { padding: 16px 20px 32px; background: #f6f7fb; min-height: calc(100vh - 64px); }
        .dash-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .dash-title { margin:0; font-size:22px; font-weight:800; color:#0b1324; }
        .status { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; }
        .status-dot { width:8px; height:8px; border-radius:50%; background:#bbb; }
        .status.ok { background:#e7f7ef; color:#115e36; border:1px solid #bfead2; }
        .status.ok .status-dot { background:#24c369; }
        .status.bad { background:#feecec; color:#7b1919; border:1px solid #f6c8c8; }
        .status.bad .status-dot { background:#e23939; }

        .section { margin:18px 0 10px; font-size:14px; color:#61708b; letter-spacing:.6px; text-transform:uppercase; }
        .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:12px; }
        .top-row { margin: 8px 0 10px; }

        .card { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:16px; transition:transform .15s ease, box-shadow .15s ease; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
        .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
        .card-label { font-size:12px; color:#7d889c; display:flex; align-items:center; gap:8px; }
        .card-value { font-size:30px; font-weight:800; color:#0b1324; }

        .panel { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:12px 14px; }
        .panel-title { font-weight:800; font-size:14px; color:#0b1324; margin-bottom:6px; }
        .panel-empty { font-size:13px; color:#7d889c; }
        .alert-row { display:flex; align-items:center; gap:10px; padding:6px 0; border-bottom:1px dashed rgba(0,0,0,.06); }
        .alert-row:last-child { border-bottom:none; }
        .alert-time { width:96px; font-size:12px; color:#7d889c; }
        .alert-name { min-width:180px; color:#0b1324; }
        .alert-msg { color:#3b465c; font-size:13px; }
        .dot { display:inline-block; width:10px; height:10px; border-radius:999px; background:#bbb; }
        .dot-warn { background:#f5b301; }
        .dot-fault { background:#e23939; }
        .dot-ok { background:#35c759; }

        /* NEW: tiny health dots inside tiles */
        .health-dot { display:inline-block; width:10px; height:10px; border-radius:999px; box-shadow: 0 0 0 1px rgba(0,0,0,.06) inset; }
        .health-dot.ok { background:#35c759; }
        .health-dot.warn { background:#f5b301; }
        .health-dot.fault { background:#e23939; }
        .health-dot.neutral { background:#c9ceda; }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  return (
    <TelemetryProvider>
      <ModernDashboard />
    </TelemetryProvider>
  );
}
