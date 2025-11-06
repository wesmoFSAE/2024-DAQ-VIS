// src/pages/Dashboard.tsx
import React from "react";
import {
  TelemetryProvider,
  useTelemetryConnection,
  useMetric,
  useTelemetryState,          // <-- add this
} from "../components/dashboard/TelemetryProvider.tsx";

function Tile({ label }: { label: string }) {
  const m = useMetric(label);
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, width: 240, marginRight: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700 }}>
        {m.value !== undefined ? m.value.toFixed(1) : "—"} {m.unit ?? ""}
      </div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>
        {m.ts ? new Date(m.ts).toLocaleTimeString() : ""}
      </div>
    </div>
  );
}

function DebugDump() {
  const { last, _ver } = useTelemetryState();
  return (
    <pre style={{ marginTop: 16, background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
{JSON.stringify({ _ver, last }, null, 2)}
    </pre>
  );
}

function DashboardInner() {
  const connected = useTelemetryConnection();
  return (
    <div style={{ padding: 16 }}>
      <h2>Live Telemetry {connected ? "🟢 connected" : "🔴 disconnected"}</h2>
      <div style={{ display: "flex", marginTop: 8 }}>
        <Tile label="Motor Temp" />
        <Tile label="Motor Speed" />
        <Tile label="SoC" />
        <Tile label="DC Voltage" />
      </div>
      <DebugDump />   {/* <-- shows exactly what the provider sees */}
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
