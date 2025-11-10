import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import mqtt from "mqtt/dist/mqtt.js";
import type { IClientOptions, MqttClient } from "mqtt";

/* ========= Types ========= */
type MetricRow = { ts: number; value: number };
type SeriesMap = Record<string, MetricRow[]>;
type LastMap = Record<string, { ts: number; value: number; unit?: string }>;

export type FaultEvent = {
  ts: number;
  name: string;
  status: "WARN_HIGH" | "FAULT_HIGH" | "FAULT_LOW" | "RESOLVED";
  value: number;
  source?: string;
  message?: string;
};

type Health = "OK" | "WARN" | "FAULT";
type StatusMap = Record<string, Health>;

type TelemetryCtxType = {
  connected: boolean;
  last: LastMap;
  series: SeriesMap;
  faults: FaultEvent[];
  status: StatusMap;            // <— NEW: live per-metric health
  _ver: number;
};

const TelemetryCtx = createContext<TelemetryCtxType>({
  connected: false, last: {}, series: {}, faults: [], status: {}, _ver: 0
});

/* ========= Config ========= */
const MAX_POINTS = 600;
const TOPICS = ["wesmo/telemetry", "wesmo/telemetry/#", "wesmo/faults", "wesmo/faults/#"];

const ALIASES: Record<string, string> = {
  // typos / variants
  "Break Pressure Front": "Brake Pressure Front",
  "Break Pressure Rear": "Brake Pressure Rear",

  // battery & power
  "battery voltage": "Battery Voltage",
  "pack voltage": "Battery Voltage",
  "dc bus voltage": "Battery Voltage", // backend uses Battery Voltage thresholds for pack V
  "battery current": "Battery Current",
  "pack current": "Battery Current",
  "dc current": "Battery Current",
  "battery dcl": "DCL",
  "dcl": "DCL",

  // temps
  "controller temp": "Inverter Temp",
  "controller temperature": "Inverter Temp",
};
const norm = (n: string) => ALIASES[n] ?? n;

/* ========= Tolerant parsing ========= */
function parsePayload(buf: Uint8Array) {
  const txt = new TextDecoder().decode(buf);

  // Strict JSON first
  try { return JSON.parse(txt); } catch {}

  // Tolerant path: accept single quotes, unquoted keys, and bareword values
  try {
    let s = txt.trim();
    s = s.replace(/'/g, '"'); // normalize quotes
    s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9 _-]*)(\s*:)/g, '$1"$2"$3'); // quote keys
    s = s.replace(/(:\s*)([A-Za-z%][A-Za-z0-9%._-]*)(\s*([}\],]))/g, '$1"$2"$3'); // quote bare values
    return JSON.parse(s);
  } catch (e) {
    console.warn("[WESMO MQTT] parse failed:", txt, e);
    return null;
  }
}

/* ========= Provider ========= */
export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const url = (process.env.REACT_APP_MQTT_URL as string) || "ws://127.0.0.1:9001";

  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);

  const lastRef   = useRef<LastMap>({});
  const seriesRef = useRef<SeriesMap>({});
  const faultsRef = useRef<FaultEvent[]>([]);
  const statusRef = useRef<StatusMap>({});     // <— NEW

  useEffect(() => {
    const opts: IClientOptions = { path: "/mqtt", protocolVersion: 4 };
    const client: MqttClient = mqtt.connect(url, opts);

    const onConnect = () => {
      setConnected(true);
      client.subscribe(TOPICS);
      console.log("[WESMO MQTT] connected + subscribed");
    };
    const onClose = () => setConnected(false);
    const onError = () => setConnected(false);

    client.on("connect", onConnect);
    client.on("close", onClose);
    client.on("error", onError);

    client.on("message", (_topic: string, payload: Uint8Array) => {
      const raw = new TextDecoder().decode(payload);

      // Try JSON first so we catch fault events reliably
      let obj: any = null;
      try { obj = JSON.parse(raw); } catch {}
      if (!obj) obj = parsePayload(payload);
      if (!obj) return;

      // ---- Fault event path ----
      if (obj && (obj.kind === "fault_event" || (obj.status && obj.name))) {
        const ev: FaultEvent = {
          ts: typeof obj.ts === "number" ? obj.ts : Date.now(),
          name: String(obj.name),
          status: String(obj.status) as FaultEvent["status"],
          value: Number(obj.value ?? NaN),
          source: obj.source,
          message: obj.message,
        };
        faultsRef.current.push(ev);
        if (faultsRef.current.length > 300) faultsRef.current.splice(0, faultsRef.current.length - 300);

        // Update per-metric health map
        const toHealth = (s: FaultEvent["status"]): Health =>
          s === "RESOLVED" ? "OK" : (s.startsWith("WARN") ? "WARN" : "FAULT");
        statusRef.current[ev.name] = toHealth(ev.status);

        setTick((v) => v + 1);
        return;
      }

      // ---- Numeric telemetry path ----
      const name = norm(obj?.name);
      const ts =
        typeof obj?.ts === "number" ? obj.ts :
        typeof obj?.time === "number" ? obj.time : Date.now();
      const value = Number(obj?.value);
      const unit = obj?.unit;

      if (!name || !Number.isFinite(value)) return;

      lastRef.current[name] = { ts, value, unit };
      const arr = seriesRef.current[name] || (seriesRef.current[name] = []);
      arr.push({ ts, value });
      if (arr.length > MAX_POINTS) arr.splice(0, arr.length - MAX_POINTS);

      setTick((v) => v + 1);
    });

    return () => {
      const anyClient = client as any;
      if (typeof anyClient.off === "function") {
        anyClient.off("connect", onConnect);
        anyClient.off("close", onClose);
        anyClient.off("error", onError);
      } else if (typeof client.removeListener === "function") {
        client.removeListener("connect", onConnect);
        client.removeListener("close", onClose);
        client.removeListener("error", onError);
      }
      client.end(true);
    };
  }, [url]);

  const ctx = useMemo<TelemetryCtxType>(
    () => ({ connected, last: lastRef.current, series: seriesRef.current, faults: faultsRef.current, status: statusRef.current, _ver: tick }),
    [connected, tick]
  );

  return <TelemetryCtx.Provider value={ctx}>{children}</TelemetryCtx.Provider>;
}

/* ========= Hooks ========= */
export function useMetric(name: string) {
  const { last, series } = useContext(TelemetryCtx);
  const key = norm(name);
  return {
    value: last[key]?.value as number | undefined,
    unit: last[key]?.unit as string | undefined,
    ts: last[key]?.ts as number | undefined,
    series: (series[key] || []) as MetricRow[],
  };
}
export function useTelemetryConnection() {
  return useContext(TelemetryCtx).connected;
}
export function useTelemetryState() {
  return useContext(TelemetryCtx);
}
export function useFaults() {
  return useContext(TelemetryCtx).faults;
}

/** NEW: access live status map (OK/WARN/FAULT) */
export function useStatuses() {
  return useContext(TelemetryCtx).status;
}

/* Derived helpers */
export function usePowerKW() {
  const v = useMetric("DC Voltage").value ?? NaN;
  const a = useMetric("Battery Current").value ?? NaN;
  const p = Number.isFinite(v) && Number.isFinite(a) ? (v * a) / 1000 : undefined;
  return p;
}
export function useHottestTemp() {
  const m = useMetric("Motor Temp").value;
  const inv = useMetric("Inverter Temp").value;
  const arr = [m, inv].filter((x) => Number.isFinite(x)) as number[];
  if (arr.length === 0) return { name: undefined as string | undefined, val: undefined as number | undefined };
  const val = Math.max(...arr);
  const name = val === m ? "Motor Temp" : "Inverter Temp";
  return { name, val };
}
