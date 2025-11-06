// src/components/dashboard/TelemetryProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import mqtt from "mqtt/dist/mqtt.js";
import type { IClientOptions, MqttClient } from "mqtt";

type MetricRow = { ts: number; value: number };
type SeriesMap = Record<string, MetricRow[]>;
type LastMap = Record<string, { ts: number; value: number; unit?: string }>;
type TelemetryCtxType = { connected: boolean; last: LastMap; series: SeriesMap; _ver: number };

const TelemetryCtx = createContext<TelemetryCtxType>({ connected: false, last: {}, series: {}, _ver: 0 });

const MAX_POINTS = 600;
const TOPICS = ["wesmo/telemetry", "wesmo/telemetry/#"];

const ALIASES: Record<string, string> = {
  "Break Pressure Front": "Brake Pressure Front",
  "Break Pressure Rear": "Brake Pressure Rear",
};
const norm = (n: string) => ALIASES[n] ?? n;

// Coerce PowerShell-style pseudo JSON to valid JSON if needed
function toStrictJson(raw: string): string {
  let t = raw.trim();

  // 1) Quote keys:  {foo: ... , motor_speed: ...} -> {"foo": ... , "motor_speed": ...}
  t = t.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');

  // 2) Quote *bareword* string values (letters/underscores/spaces). Do NOT touch numbers/booleans/null.
  //    name:Motor Temp}   -> "name":"Motor Temp"}
  //    source:TEST,       -> "source":"TEST",
  //    unit:degC,         -> "unit":"degC",
  t = t.replace(/:\s*([A-Za-z][A-Za-z0-9_ ]*)\s*(?=[,}])/g, (_m, s: string) => {
    const word = s.trim();
    // leave true/false/null alone (case-insensitive)
    if (/^(true|false|null)$/i.test(word)) return ':' + word.toLowerCase();
    return ':"' + word + '"';
  });

  return t;
}


function parsePayload(buf: Uint8Array) {
  const txt = new TextDecoder().decode(buf);

  // Try strict JSON first
  try { return JSON.parse(txt); } catch {}

  try {
    let s = txt.trim();

    // 1) normalize single -> double quotes
    s = s.replace(/'/g, '"');

    // 2) quote keys: { key: ... } or , key: ...
    s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9 _-]*)(\s*:)/g, '$1"$2"$3');

    // 3) quote bare *string* values (including ones with spaces) up to , } or ]
    //    leave numbers / booleans / null untouched
    s = s.replace(/(:\s*)([^"{\[\d-][^,}\]]*)(\s*([}\],]))/g, (_m, p1, val, p3) => {
      const t = val.trim();
      const low = t.toLowerCase();
      if (low === 'true' || low === 'false' || low === 'null') return p1 + low + p3;
      if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return p1 + t + p3; // numeric
      return p1 + '"' + t + '"' + p3; // quote strings like Motor Temp, DC Voltage, degC, rpm, V, %
    });

    return JSON.parse(s);
  } catch (e) {
    console.warn('[WESMO MQTT] parse failed:', txt, e);
    return null;
  }
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const url = process.env.REACT_APP_MQTT_URL || "ws://127.0.0.1:9001";
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);

  const lastRef = useRef<LastMap>({});
  const seriesRef = useRef<SeriesMap>({});

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
      console.log("[WESMO MQTT] msg", raw);

      // ✅ pass the bytes, not the decoded string
      const obj = parsePayload(payload);
      if (!obj) return;

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

      console.log("[WESMO MQTT] update ->", name, value, unit);
      setTick(v => v + 1);
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
    () => ({ connected, last: lastRef.current, series: seriesRef.current, _ver: tick }),
    [connected, tick]
  );

  return <TelemetryCtx.Provider value={ctx}>{children}</TelemetryCtx.Provider>;
}

// Public hooks
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

// Debug helper: dump full context
export function useTelemetryState() {
  return useContext(TelemetryCtx);
}
