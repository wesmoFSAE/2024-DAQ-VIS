// src/pages/Dashboard.tsx
import React from "react";
import {
  TelemetryProvider,
  useTelemetryConnection,
  useMetric,
  useTelemetryState,
} from "../components/dashboard/TelemetryProvider.tsx";

/* ---------------- helpers (unchanged logic) ---------------- */
function useValue(name: string) {
  return useMetric(name).value;
}
function useUnit(name: string) {
  return useMetric(name).unit;
}
function usePowerKW() {
  const v = useValue("DC Voltage");       // V
  const a = useValue("Battery Current");  // A
  if (typeof v === "number" && typeof a === "number") return (v * a) / 1000; // kW
  return undefined;
}
function useHottestTemp() {
  const picks = [
    { label: "Motor Temp", val: useValue("Motor Temp") },
    { label: "Inverter Temp", val: useValue("Inverter Temp") },
    { label: "Battery Temp", val: useValue("Battery Temp") },
    { label: "Battery Temperature", val: useValue("Battery Temperature") },
  ].filter(x => typeof x.val === "number") as { label: string; val: number }[];
  if (picks.length === 0) return { label: undefined as string | undefined, val: undefined as number | undefined };
  return picks.reduce((a, b) => (a.val >= b.val ? a : b));
}

/* ---------------- aesthetic styles ---------------- */
const Theme = () => (
  <style>{`
    :root{
      --bg:#f7f8fc;
      --card:#ffffff;
      --ink:#0f1222;
      --muted:#6b7280;
      --ring:#e7eaf3;
      --ring-strong:#d5daf0;
      --accent1:#6E8BFF;
      --accent2:#9AE6E8;
      --shadow-sm:0 4px 12px rgba(17, 24, 39, .06);
      --shadow-md:0 10px 30px rgba(17, 24, 39, .10);
      --shadow-lg:0 18px 40px rgba(17, 24, 39, .15);
    }

    .wrap{
      min-height:100vh;
      padding:24px;
      background: radial-gradient(1200px 600px at 20% -10%, #ffffff 0%, transparent 60%) , var(--bg);
      color:var(--ink);
    }

    .title{
      margin: 2px 0 12px;
      font-weight: 800;
      letter-spacing:.2px;
      display:flex; align-items:center; gap:12px;
    }

    .badgeRow{
      display:flex; gap:10px; align-items:center;
      border:1px solid var(--ring); border-radius:12px; padding:10px 12px;
      background:linear-gradient(180deg,#fff, #fafbff);
      box-shadow:var(--shadow-sm);
      margin-bottom:16px;
    }
    .chip{
      display:flex; align-items:center; gap:8px;
      font-size:12px; padding:6px 10px; border-radius:999px;
      border:1px solid var(--ring);
      background:#fff;
    }
    .dot{ width:10px; height:10px; border-radius:999px; display:inline-block; }
    .ok{ background:#22c55e; } .bad{ background:#ef4444; } .unk{ background:#9ca3af; }

    h3.section{
      margin: 18px 0 10px;
      font-weight: 800;
      letter-spacing:.2px;
      background: linear-gradient(90deg, var(--ink), #3a3d4a);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }

    .grid{
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap:14px;
      margin-bottom:4px;
    }

    .card{
      position:relative;
      background:var(--card);
      border:1px solid var(--ring);
      border-radius:16px;
      padding:16px 18px;
      overflow:hidden;
      box-shadow:var(--shadow-sm);
      transition: transform .22s cubic-bezier(.22,.61,.36,1), box-shadow .22s, border-color .22s;
      will-change: transform, box-shadow;
      isolation:isolate;
    }
    /* glossy hover line */
    .card::after{
      content:"";
      position:absolute; inset:-1px;
      border-radius:16px;
      background:linear-gradient(90deg, rgba(110,139,255,.0), rgba(110,139,255,.12), rgba(154,230,232,.0));
      opacity:0; transition:opacity .25s;
      pointer-events:none;
      z-index:0;
    }
    .card:hover{
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--ring-strong);
    }
    .card:hover::after{ opacity:1; }

    .label{ font-size:12px; color:var(--muted); margin-bottom:8px; position:relative; z-index:1; }
    .value{
      font-size:34px; font-weight:900; letter-spacing:.2px; line-height:1.15;
      position:relative; z-index:1;
      display:flex; align-items:baseline; gap:8px;
    }
    .unit{ font-size:18px; color:var(--muted); font-weight:700; }

    .livePill{
      margin-left:auto; font-size:12px; color:var(--muted);
      border:1px dashed var(--ring); padding:6px 10px; border-radius:8px;
      background:#fff; box-shadow:var(--shadow-sm);
    }

    @media (hover:hover){
      .card:active{ transform: translateY(0); box-shadow:var(--shadow-sm); }
    }
  `}</style>
);

/* ---------------- UI atoms ---------------- */
function StatusDot({ ok }: { ok: boolean | undefined }) {
  const cls = ok === undefined ? "dot unk" : ok ? "dot ok" : "dot bad";
  return <span className={cls} />;
}

function Card({ label, value, unit }: { label: string; value?: number; unit?: string }) {
  const formatted =
    typeof value === "number"
      ? value.toFixed((Math.abs(value) >= 100 || Number.isInteger(value)) ? 0 : 1)
      : "—";
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">
        {formatted} <span className="unit">{unit ?? ""}</span>
      </div>
    </div>
  );
}

/* ---------------- rows ---------------- */
function TopStatus() {
  const connected = useTelemetryConnection();
  const state = useTelemetryState();
  const hasSoC = state.last["SoC"] !== undefined;
  const hasBMS = state.last["DC Voltage"] !== undefined;
  const hasMC  = state.last["Motor Speed"] !== undefined;

  return (
    <div className="badgeRow">
      <div className="chip"><StatusDot ok={connected} /> MQTT</div>
      <div className="chip"><StatusDot ok={hasBMS} /> BMS</div>
      <div className="chip"><StatusDot ok={hasMC} /> MC</div>
      <div className="chip"><StatusDot ok={hasSoC} /> SoC</div>
      <div className="livePill">live: wesmo/telemetry/#</div>
    </div>
  );
}

function RowPowertrain() {
  const soc = useMetric("SoC");
  const v = useMetric("DC Voltage");
  const a = useMetric("Battery Current");
  const dcl = useMetric("DCL");
  const pkw = usePowerKW();
  const hottest = useHottestTemp();

  return (
    <>
      <h3 className="section">Powertrain & Energy</h3>
      <div className="grid">
        <Card label="SoC" value={soc.value} unit={soc.unit ?? "%"} />
        <Card label="Pack Power" value={pkw} unit="kW" />
        <Card label="DC Voltage" value={v.value} unit={v.unit ?? "V"} />
        <Card label="Battery Current" value={a.value} unit={a.unit ?? "A"} />
        <Card label="Hottest Temp" value={hottest.val} unit="°C" />
        <Card label="DCL (limit)" value={dcl.value} unit={dcl.unit ?? "A"} />
      </div>
    </>
  );
}

function RowDynamics() {
  const rpm = useMetric("Motor Speed");
  const fr = useMetric("Wheel Speed FR");
  const fl = useMetric("Wheel Speed FL");
  const rr = useMetric("Wheel Speed RR");
  const rl = useMetric("Wheel Speed RL");
  const bpf = useMetric("Brake Pressure Front");
  const bpr = useMetric("Brake Pressure Rear");

  return (
    <>
      <h3 className="section">Dynamics</h3>
      <div className="grid">
        <Card label="Motor Speed" value={rpm.value} unit={rpm.unit ?? "rpm"} />
        <Card label="Brake Pressure Front" value={bpf.value} unit={bpf.unit ?? "bar"} />
        <Card label="Brake Pressure Rear"  value={bpr.value} unit={bpr.unit ?? "bar"} />
        <Card label="Wheel Speed FR" value={fr.value} unit={fr.unit ?? "km/h"} />
        <Card label="Wheel Speed FL" value={fl.value} unit={fl.unit ?? "km/h"} />
        <Card label="Wheel Speed RR" value={rr.value} unit={rr.unit ?? "km/h"} />
        <Card label="Wheel Speed RL" value={rl.value} unit={rl.unit ?? "km/h"} />
      </div>
    </>
  );
}

/* ---------------- page ---------------- */
function DashboardInner() {
  const connected = useTelemetryConnection();
  return (
    <div className="wrap">
      <Theme />
      <h2 className="title">
        Pit Dashboard {connected ? "🟢 connected" : "🔴 disconnected"}
      </h2>
      <TopStatus />
      <RowPowertrain />
      <RowDynamics />
    </div>
  );
}

export default function Dashboard() {
  return (
    <TelemetryProvider>
      <DashboardInner />
    </TelemetryProvider>
  );
}
