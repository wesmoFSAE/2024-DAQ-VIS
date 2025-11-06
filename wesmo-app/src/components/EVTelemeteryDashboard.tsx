import React, { useEffect, useState } from "react";
import mqtt from "mqtt"; // ✅ typed entry
import type { IClientOptions, MqttClient } from "mqtt";

export default function EVTelemetryDashboard() {
  const url = process.env.REACT_APP_MQTT_URL || "ws://127.0.0.1:9001"; // no path by default
  const [status, setStatus] = useState("connecting");
  const [msgs, setMsgs] = useState<any[]>([]);

  useEffect(() => {
    const baseOpts: IClientOptions = {
      protocolVersion: 4,
      username: process.env.REACT_APP_MQTT_USERNAME,
      password: process.env.REACT_APP_MQTT_PASSWORD,
      reconnectPeriod: 2000,
      keepalive: 60,
      clean: true,
    };
    const opts: IClientOptions = url.endsWith("/mqtt") ? baseOpts : { ...baseOpts, path: "/mqtt" };

    const client: MqttClient = mqtt.connect(url, opts);

    client.on("connect", () => {
      setStatus("connected");
      client.subscribe("wesmo/telemetry/#");
    });

    client.on("message", (_topic, payload) => {
      try {
        const obj = JSON.parse(new TextDecoder().decode(payload));
        setMsgs((m) => [obj, ...m].slice(0, 50));
      } catch { /* ignore non-JSON */ }
    });

    client.on("error", () => setStatus("error"));
    client.on("close", () => setStatus("closed"));
    return () => { client.end(true); };
  }, [url]);

  return (
    <div style={{ padding: 16 }}>
      <h2>WESMO • Live Feed ({status})</h2>
      <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
        {msgs.map((m, i) => (
          <div key={i}>{JSON.stringify(m)}</div>
        ))}
      </div>
    </div>
  );
}
