"""
File: mqtt_subscriber.py
Purpose:
  - Subscribe to raw CAN-over-MQTT frames published on /wesmo-data (your simulator).
  - Decode them (BMS / MC / VCU) with your translators.
  - Save to Postgres.
  - Publish single-row JSON messages to 'wesmo/telemetry' for the React dashboard.

Notes:
  - Works even if Redis is not running.
  - No HTTP calls are required to run.
  - Payload shape matches your working PowerShell injector:
      {"ts": 1711111111111, "source": "CAN", "name": "...", "value": 123.4, "unit": "degC"}
"""

from __future__ import annotations

import datetime
import json
import os
import pickle
import random
import threading
import time
from typing import Any, Dict, List, Optional

import paho.mqtt.client as mqtt_client

# Optional dependencies (safe if missing/off)
try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # type: ignore

# ---- Local modules ----
from MCTranslatorClass import MCTranslator
from BMSTranslatorClass import BMSTranslator
from VCUTranslatorClass import VCUTranslator

from database import (
    start_postgresql,
    setup_db,
    connect_to_db,
    create_mc_table,
    create_bms_table,
    create_vcu_table,
    save_to_db_mc,
    save_to_db_bms,
    save_to_db_vcu,
)

# =============================================================================
# Config (env overridable so the simulator + dashboard can share settings)
# =============================================================================

def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value


BROKER = _env("WESMO_MQTT_BROKER", "localhost")
PORT = int(_env("WESMO_MQTT_PORT", "1883"))

RAW_TOPIC = _env("WESMO_RAW_TOPIC", "/wesmo-data")  # simulator publishes here
UI_TOPIC = _env("WESMO_UI_TOPIC", "wesmo/telemetry")  # dashboard listens here

USERNAME = _env("WESMO_MQTT_USERNAME")
PASSWORD = _env("WESMO_MQTT_PASSWORD")

REDIS_ENABLED = _env("WESMO_ENABLE_REDIS", "0").lower() in {"1", "true", "yes", "on"}
DB_ENABLED = _env("WESMO_ENABLE_DB", "1").lower() not in {"0", "false", "no", "off"}

# Watchdog for incoming frames (seconds)
TIMEOUT_SEC = int(_env("WESMO_TIMEOUT_SEC", "30"))

# =============================================================================
# Globals
# =============================================================================

client_id = f"wesmo-sub-{random.randint(1000, 9999)}"
dash_pub_id = f"wesmo-dash-pub-{random.randint(1000, 9999)}"

# Translators
mc_translator = MCTranslator()
bms_translator = BMSTranslator()
vcu_translator = VCUTranslator()

# DB globals
cursor = None
conn = None

# Redis (optional)
redis_client: Optional[Any] = None
_redis_warned = False

# MQTT publisher for UI
_dash_pub: Optional[mqtt_client.Client] = None

# Watchdog
timeout_timer: Optional[threading.Timer] = None
timed_out = False


# =============================================================================
# Utilities
# =============================================================================

def log(msg: str) -> None:
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


def now_ms() -> int:
    return int(time.time() * 1000)


# =============================================================================
# Redis (optional)
# =============================================================================

def start_redis() -> Optional[Any]:
    if not REDIS_ENABLED or redis is None:
        return None
    try:
        r = redis.Redis(host="localhost", port=6379, db=0, socket_timeout=1.0)
        r.ping()
        log("[REDIS] connected")
        return r
    except Exception as e:
        log(f"[REDIS] not available ({e}). Continuing without Redis.")
        return None


# =============================================================================
# UI Publisher
# =============================================================================

def start_dash_publisher() -> None:
    """Dedicated MQTT client used to publish UI messages to wesmo/telemetry."""
    global _dash_pub

    pub = mqtt_client.Client(
        client_id=dash_pub_id,
        protocol=mqtt_client.MQTTv311,
        transport="tcp",
    )
    if USERNAME:
        pub.username_pw_set(USERNAME, PASSWORD or None)

    def on_connect(c, u, f, rc):
        log(f"[DASH] connected rc={rc} as {dash_pub_id}")

    pub.on_connect = on_connect
    pub.connect(BROKER, PORT, keepalive=30)
    pub.loop_start()
    _dash_pub = pub
    log(f"[DASH] publisher started -> topic '{UI_TOPIC}'")


def publish_for_ui(name: str, value: Any, unit: str = "", source: str = "CAN") -> None:
    """Always push a single-row message for the React dashboard."""
    if _dash_pub is None or not name:
        return
    try:
        v = float(value) if isinstance(value, (int, float)) else value
        payload = {
            "ts": now_ms(),
            "source": source,
            "name": name,
            "value": v,
            "unit": unit or "",
        }
        j = json.dumps(payload, separators=(",", ":"))
        _dash_pub.publish(UI_TOPIC, j, qos=0, retain=False)
        # Verbose logging to see live traffic
        log(f"[PUB] {name} = {v} {unit}")
    except Exception as e:
        log(f"[PUB] error for {name}: {e}")


# =============================================================================
# Cache + Publish (safe)
# =============================================================================

def cache_data(time_parts, value) -> None:
    """
    Safe cache + publish:
    - **Always** publish to the dashboard so UI updates even when Redis is down.
    - Optionally cache the latest value in Redis when enabled.
    """
    # 1) Publish to UI (first, so failures don't block UI updates)
    try:
        publish_for_ui(
            value.get("name", ""),
            value.get("value", 0),
            value.get("unit", ""),
            source="CAN",
        )
    except Exception as e:
        log(f"[PUB] error in cache_data publish: {e}")

    # 2) Redis cache (optional)
    if not REDIS_ENABLED or redis_client is None:
        return

    global _redis_warned
    try:
        redis_key = value["name"]
        redis_val = {
            "time": f"{time_parts[1]} {time_parts[2]}",
            "name": value["name"],
            "value": value["value"],
            "unit": value.get("unit", ""),
        }
        redis_client.set(redis_key, pickle.dumps(redis_val))
    except Exception as e:  # log once
        if not _redis_warned:
            log(f"[REDIS] cache disabled ({e})")
            _redis_warned = True


# =============================================================================
# Subscriber
# =============================================================================

def connect_subscriber() -> mqtt_client.Client:
    def on_connect(c, u, f, rc):
        if rc == 0:
            log(f"[MQTT] connected to {BROKER}:{PORT}")
        else:
            log(f"[MQTT] failed rc={rc}")

    sub = mqtt_client.Client(
        client_id=client_id,
        protocol=mqtt_client.MQTTv311,
        transport="tcp",
    )
    if USERNAME:
        sub.username_pw_set(USERNAME, PASSWORD or None)

    sub.on_connect = on_connect
    sub.connect(BROKER, PORT, keepalive=30)
    return sub


def reset_timeout() -> None:
    global timeout_timer, timed_out
    if timeout_timer:
        timeout_timer.cancel()
    timeout_timer = threading.Timer(TIMEOUT_SEC, _on_timeout)
    timeout_timer.daemon = True
    timeout_timer.start()
    if timed_out:
        timed_out = False
        log("[WATCHDOG] activity resumed")


def _on_timeout() -> None:
    global timed_out
    timed_out = True
    log("[WATCHDOG] timeout (no raw frames)")
    if redis_client:
        try:
            redis_client.flushdb()
            log("[WATCHDOG] redis flushed")
        except Exception as e:
            log(f"[WATCHDOG] redis flush error: {e}")


def _iter_rows(decoded: Any) -> List[Dict[str, Any]]:
    if not decoded:
        return []
    if isinstance(decoded, list):
        return [r for r in decoded if isinstance(r, dict)]
    if isinstance(decoded, dict):
        return [decoded]
    return []


def _handle_block(label: str, decoded: Any) -> None:
    rows = _iter_rows(decoded)
    if not rows:
        return

    # Save to DB (preserve prior behavior) when enabled
    if cursor and conn:
        try:
            if label == "BMS":
                save_to_db_bms(cursor, conn, decoded)
            elif label == "MC":
                # decoded[1] is the PDO integer in the original translator output
                pdo = decoded[1] if isinstance(decoded, list) and len(decoded) > 1 else None
                save_to_db_mc(cursor, conn, decoded, pdo)
            elif label == "VCU":
                save_to_db_vcu(cursor, conn, decoded)
        except Exception as e:
            log(f"[DB] write failed ({label}): {e}")

    # Publish each numeric row to UI (also cached by cache_data from DB layer)
    for r in rows:
        name = r.get("name")
        value = r.get("value")
        unit = r.get("unit", "")
        if name and isinstance(value, (int, float)):
            publish_for_ui(name, value, unit, source=label)


def subscribe(sub: mqtt_client.Client) -> None:
    def on_message(client, userdata, msg):
        reset_timeout()
        try:
            raw_text = msg.payload.decode("utf-8", errors="ignore")
        except Exception:
            log("[SUB] decode error")
            return

        normalized = raw_text.lower().replace(" ", "").replace("\t", "")

        # BMS
        if "id:004d" in normalized:
            _handle_block("BMS", bms_translator.decode(raw_text))

        # MC group: 0181/0281/0381/0481
        if any(f"id:{i}" in normalized for i in ["0181", "0281", "0381", "0481"]):
            _handle_block("MC", mc_translator.decode(raw_text))

        # VCU group: 0010/0011/0012/0201
        if any(f"id:{i}" in normalized for i in ["0010", "0011", "0012", "0201"]):
            _handle_block("VCU", vcu_translator.decode(raw_text))

    sub.subscribe(RAW_TOPIC, qos=0)
    sub.on_message = on_message
    log(f"[SUB] subscribed to '{RAW_TOPIC}'")


# =============================================================================
# Entrypoint
# =============================================================================

def start_mqtt_subscriber() -> None:
    global cursor, conn, redis_client

    if DB_ENABLED:
        try:
            cursor, conn = start_postgresql()
            setup_db(cursor, conn)
            cursor, conn = connect_to_db()
            create_mc_table(cursor, conn)
            create_bms_table(cursor, conn)
            create_vcu_table(cursor, conn)
            log("[DB] connected and ready")
        except Exception as e:
            log(f"[DB] disabled (connection failed: {e})")
            cursor = None
            conn = None
    else:
        log("[DB] disabled via WESMO_ENABLE_DB=0")

    # Optional Redis
    redis_client = start_redis()

    # UI publisher
    start_dash_publisher()

    # Raw subscriber
    reset_timeout()
    sub = connect_subscriber()
    subscribe(sub)
    sub.loop_forever()


def main() -> None:
    start_mqtt_subscriber()


if __name__ == "__main__":
    main()
