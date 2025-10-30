// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { getSocket } from "../lib/socket.ts";
import "../styles/dashboard.css"; // ✨ style hook: ensure this path is correct

/* ================= Types ================= */
type Point = { t: number; v: number };
type Series = Point[];
type Store = Record<string, Series>;

type TelemetryRow = {
  time?: number | string;
  ts?: number;
  name: string;
  value: number;
  unit?: string;
};

/* ================= Config ================= */
const MAX_POINTS = 120;
const POLL_MS = 1000;

const WATCH = [
  { key: "Motor Temperature", label: "Motor Temp" },
  { key: "Motor Speed", label: "Motor Speed" },
  { key: "Battery State of Charge", label: "SoC" },
  { key: "DC Link Circuit Voltage", label: "DC Voltage" },
];

const WIP_MODE = false;            // leave false to show the dashboard
const NAV_OFFSET_PX = 72;

/* =============== Full-page WIP cover (unchanged) =============== */
function FullPageWIP() {
  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        top: NAV_OFFSET_PX,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        minHeight: `calc(100vh - ${NAV_OFFSET_PX}px)`,
        width: "100vw",
        background:
          "radial-gradient(1200px 600px at 10% -20%, rgba(94,200,255,.22), transparent 50%), " +
          "radial-gradient(900px 500px at 120% 120%, rgba(255,120,120,.16), transparent 40%), " +
          "linear-gradient(120deg, rgba(255,255,255,.04), rgba(255,255,255,0))",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundSize: "22px 22px",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), " +
            "linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          textAlign: "center",
          padding: "48px 24px",
          maxWidth: 860,
          width: "min(92vw, 860px)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,.18)",
          background: "rgba(0,0,0,.34)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,.22)",
            background: "rgba(0,0,0,.35)",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f5b301" }} />
          Private build • Work in progress
        </div>

        <h1 style={{ margin: "16px 0 8px", fontSize: 40, lineHeight: 1.1, fontWeight: 900 }}>
          WESMO Live Dashboard
        </h1>
        <p style={{ margin: "0 0 22px", opacity: 0.88, fontSize: 16 }}>
          We’re wiring the car and tuning the telemetry. This page will stream real-time data
          once systems are cleared for public release.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/history"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
              background: "linear-gradient(90deg, #5ec8ff, #9ef1ff)",
              color: "#000",
            }}
          >
            See History
          </a>
        </div>

        <div
          style={{
            marginTop: 28,
            height: 6,
            borderRadius: 999,
            background: "rgba(255,255,255,.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              background: "linear-gradient(90deg, #5ec8ff, #9ef1ff)",
              animation: "wipbar 2.4s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes wipbar {
          0% { transform: translateX(-60%); }
          50% { transform: translateX(10%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}

/* =============== Data hook (unchanged) =============== */
function useLiveStore() {
  const [store, setStore] = useState<Store>({});
  const [connected, setConnected] = useState(false);
  const sockRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    const socket = getSocket();
    sockRef.current = socket;

    const upsert = (rows: TelemetryRow[]) => {
      setStore((prev) => {
        const next = { ...prev };
        for (const r of rows) {
          if (!r || typeof r.name !== "string" || typeof r.value !== "number") continue;
          const t =
            typeof r.ts === "number"
              ? r.ts
              : typeof r.time === "number"
              ? r.time
              : Date.now();
          const s = (next[r.name] || []).slice(-MAX_POINTS + 1);
          s.push({ t, v: r.value });
          next[r.name] = s;
        }
        return next;
      });
    };

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("data", (payload: any) => {
      if (Array.isArray(payload)) {
        upsert(payload as TelemetryRow[]);
      } else if (payload && typeof payload === "object" && typeof (payload as any).name === "string") {
        upsert([payload as TelemetryRow]);
      } else if (payload && typeof payload === "object") {
        const flat: TelemetryRow[] = [];
        for (const [name, row] of Object.entries<any>(payload)) {
          if (Array.isArray(row)) flat.push(...(row as TelemetryRow[]));
          else if (row && typeof row === "object") flat.push({ name, ...(row as any) });
        }
        upsert(flat);
      }
    });

    socket.on("recieve_historic_data", (rows: TelemetryRow[]) => upsert(rows));
    socket.on("timerRecieve", (_timer: any) => {});
    const iv = setInterval(() => socket.emit("update_clients"), POLL_MS);

    return () => {
      clearInterval(iv);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("data");
      socket.off("recieve_historic_data");
      socket.off("timerRecieve");
    };
  }, []);

  return { store, connected };
}

/* =============== UI bits =============== */
function Sparkline({ series, h = 36, w = 120 }: { series: Series; h?: number; w?: number }) {
  const d = useMemo(() => {
    if (!series || series.length < 2) return "";
    const ys = series.map((p) => p.v);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const range = max - min || 1;
    const stepX = w / Math.max(series.length - 1, 1);
    return series
      .map((p, i) => {
        const x = i * stepX;
        const y = h - ((p.v - min) / range) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [series, h, w]);

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={`0,${h} ${w},${h}`} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Tile({ label, series }: { label: string; series?: Series }) {
  const last = series?.[series.length - 1];
  return (
    <div className="tile glass">{/* ✨ style hook */}
      <div>
        <div className="tile-label">{label}</div>
        <div className="tile-value">{last ? last.v.toFixed(1) : "—"}</div>
      </div>
      <div className="tile-spark">
        <Sparkline series={series || []} />
      </div>
    </div>
  );
}

/* =============== Page =============== */
const Dashboard: React.FC = () => {
  const { store, connected } = useLiveStore();

  if (WIP_MODE) return <FullPageWIP />;

  return (
    <div className="dashboard-root layout-debug">{/* ✨ style hook */}
      <div className="dashboard-header glass-lite">
        <h1 className="dash-title">Live Telemetry</h1>
        <span className={`status-pill ${connected ? "ok" : "bad"}`} title={connected ? "Connected" : "Disconnected"}>
          <span className="dot" />
          {connected ? "connected" : "disconnected"}
        </span>
      </div>

      <div className="dashboard-grid">
        {WATCH.map(({ key, label }) => (
          <Tile key={key} label={label} series={store[key]} />
        ))}
      </div>

      <div className="details glass">
        <div className="details-title">Incoming (recent 5 points per metric)</div>
        <pre className="details-json">
{JSON.stringify(
  Object.fromEntries(Object.entries(store).map(([k, v]) => [k, v.slice(-5)])),
  null,
  2
)}
        </pre>
      </div>
    </div>
  );
};

export default Dashboard;




