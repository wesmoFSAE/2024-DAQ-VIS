// src/lib/socket.ts
// MQTT-backed "socket" adapter using the BROWSER bundle (mqtt@4).

import mqtt from "mqtt/dist/mqtt.js"; // force browser build
import type { IClientOptions, MqttClient } from "mqtt";

type Handler = (...args: any[]) => void;

export type SocketLike = {
  on: (
    event: "connect" | "disconnect" | "data" | "recieve_historic_data" | "timerRecieve",
    handler: Handler
  ) => void;
  off: (event: string, handler?: Handler) => void;
  emit: (event: string, ...args: any[]) => void;
  close: () => void;
};

const TOPIC = "wesmo/telemetry/#";
const DEFAULT_WS_URL = "ws://localhost:9001";

function resolveWsUrl(): string {
  const envUrl = process.env.REACT_APP_MQTT_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }

  if (typeof window === "undefined") {
    return DEFAULT_WS_URL;
  }

  try {
    const params = new URLSearchParams(window.location.search);

    const direct = params.get("mqtt");
    if (direct && direct.trim().length > 0) {
      return direct;
    }

    const scheme =
      params.get("mqttScheme") || (window.location.protocol === "https:" ? "wss" : "ws");
    const host = params.get("mqttHost") || window.location.hostname || "localhost";
    const portParam = params.get("mqttPort");
    const port =
      portParam != null
        ? portParam
        : host === "localhost" || host === "127.0.0.1"
        ? "9001"
        : "";
    const pathParam = params.get("mqttPath");
    const path = pathParam ? (pathParam.startsWith("/") ? pathParam : `/${pathParam}`) : "";

    return `${scheme}://${host}${port ? `:${port}` : ""}${path}`;
  } catch (err) {
    console.warn("[MQTT] failed to resolve broker url, falling back to default", err);
    return DEFAULT_WS_URL;
  }
}

const WS_URL = resolveWsUrl();

if (typeof window !== "undefined") {
  console.info(`[MQTT] connecting to ${WS_URL}`);
}

/** Robust payload -> object parser (handles string, Uint8Array, Buffer-like, etc.) */
function parsePayload(payload: unknown): any | null {
  try {
    // 1) string
    if (typeof payload === "string") return JSON.parse(payload);

    // 2) Any typed-array / Buffer-like view (handles cross-realm Uint8Array)
    // ArrayBuffer.isView returns true for Uint8Array, DataView, Buffer, etc.
    if (payload && typeof payload === "object" && ArrayBuffer.isView(payload as any)) {
      const view = payload as ArrayBufferView;
      const u8 =
        // @ts-ignore: Node's Buffer also has .buffer/.byteOffset/.byteLength
        view instanceof Uint8Array
          ? (view as Uint8Array)
          : new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
      const text = new TextDecoder().decode(u8);
      return JSON.parse(text);
    }

    // 3) Last resort: try to coerce to string and parse
    const asText = String(payload ?? "");
    if (asText.startsWith("{") || asText.startsWith("[")) {
      return JSON.parse(asText);
    }
    return null;
  } catch (e) {
    console.warn("[MQTT] JSON parse failed:", e);
    return null;
  }
}

/** Normalize a single telemetry row into the shape the dashboard expects. */
function toRow(obj: any) {
  if (!obj || typeof obj.name !== "string") return null;
  const ts =
    typeof obj.ts === "number"
      ? obj.ts
      : typeof obj.time === "number"
      ? obj.time
      : Date.now();
  const value = Number(obj.value);
  if (!Number.isFinite(value)) return null;
  return { ts, name: obj.name as string, value, unit: obj.unit as string | undefined };
}

export function getSocket(): SocketLike {
  const listeners = new Map<string, Set<Handler>>();
  const on = (e: string, h: Handler) => {
    if (!listeners.has(e)) listeners.set(e, new Set());
    listeners.get(e)!.add(h);
  };
  const off = (e: string, h?: Handler) => {
    if (!h) return void listeners.delete(e);
    listeners.get(e)?.delete(h);
  };
  const fire = (e: string, ...a: any[]) => listeners.get(e)?.forEach((fn) => fn(...a));

  const opts: IClientOptions = {};
  const client: MqttClient = mqtt.connect(WS_URL, opts);

  client.on("connect", () => {
    console.log("[MQTT] connected to", WS_URL);
    fire("connect");
    client.subscribe(TOPIC);
  });
  client.on("close", () => {
    console.log("[MQTT] connection closed");
    fire("disconnect");
  });
  client.on("error", (err) => {
    console.error("[MQTT] error", err);
    fire("disconnect");
  });

  client.on("message", (_topic: string, payload: any) => {
    // DEBUG: show the raw type we got
    // (helps diagnose cross-realm typed arrays)
    // console.log("[MQTT] raw type:", typeof payload, (payload && (payload as any).constructor?.name));

    const parsed = parsePayload(payload);
    if (parsed == null) {
      console.warn("[MQTT] could not parse payload", payload);
      return;
    }

    // DEBUG: show parsed object
    console.log("[MQTT] msg", parsed);

    // Accept: single row, array of rows, or object map
    if (Array.isArray(parsed)) {
      fire("data", parsed);
      return;
    }
    if (parsed && typeof parsed === "object" && typeof parsed.name === "string") {
      const row = toRow(parsed);
      if (row) fire("data", row);
      return;
    }
    // object map (Dashboard.tsx already flattens it)
    fire("data", parsed);
  });

  return { on, off, emit: () => {}, close: () => client.end(true) };
}
