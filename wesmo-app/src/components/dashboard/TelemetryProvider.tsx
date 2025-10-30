// src/components/dashboard/TelemetryProvider.tsx
// Global telemetry context using mqtt BROWSER bundle (mqtt@4).

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import mqtt from "mqtt/dist/mqtt.js";            // 👈 force browser build
import type { IClientOptions, MqttClient } from "mqtt";

type MetricRow = { ts: number; value: number };
type SeriesMap = Record<string, MetricRow[]>;
type LastMap = Record<string, { ts: number; value: number; unit?: string }>;
type TelemetryCtxType = { connected: boolean; last: LastMap; series: SeriesMap };

const TelemetryCtx = createContext<TelemetryCtxType>({ connected: false, last: {}, series: {} });

const MAX_POINTS = 600;
const TOPIC = "wesmo/telemetry/#";

const ALIASES: Record<string, string> = {
  "Break Pressure Front": "Brake Pressure Front",
  "Break Pressure Rear": "Brake Pressure Rear",
};
const norm = (n: string) => ALIASES[n] ?? n;

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const url = process.env.REACT_APP_MQTT_URL || "ws://localhost:9001";
  const [connected, setConnected] = useState(false);

  const lastRef = useRef<LastMap>({});
  const seriesRef = useRef<SeriesMap>({});
  const [, force] = useState(0);

  useEffect(() => {
    const opts: IClientOptions = {};
    const client: MqttClient = mqtt.connect(url, opts);

    client.on("connect", () => { setConnected(true); client.subscribe(TOPIC); });
    client.on("close",   () => setConnected(false));
    client.on("error",   () => setConnected(false));

    client.on("message", (_topic: string, payload: Uint8Array) => {
      try {
        const obj = JSON.parse(new TextDecoder().decode(payload));
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

        force(n => n + 1);
      } catch {}
    });

    return () => { client.end(true); };
  }, [url]);

  const ctx = useMemo<TelemetryCtxType>(
    () => ({ connected, last: lastRef.current, series: seriesRef.current }),
    [connected]
  );

  return <TelemetryCtx.Provider value={ctx}>{children}</TelemetryCtx.Provider>;
}

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
