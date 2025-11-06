"""
File: mqtt_subscriber.py
Purpose:
  - Subscribe to raw CAN-over-MQTT frames on /wesmo-data (simulator).
  - Decode (BMS/MC/VCU) using translators.
  - Save to Postgres (optional, enabled by default).
  - Publish flat JSON rows to 'wesmo/telemetry' for the React dashboard.

UI payload shape:
  {"ts": 1711111111111, "source": "CAN|BMS|MC|VCU|TEST", "name": "...", "value": 123.4, "unit": "degC"}
"""

from __future__ import annotations

import datetime
import json
import os
import pickle
import random
import threading
import time
from typing import Any, Dict, List, Optional, Iterable

import paho.mqtt.client as mqtt_client  # paho-mqtt >= 2.0

# ---- Optional Redis ----
try:  # safe if not installed
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
# Env helpers (return concrete types to keep Pylance happy)
# =============================================================================

def _env_opt(name: str) -> Optional[str]:
    """Return env var or None if unset/blank."""
    v = os.getenv(name)
    if v is None:
        return None
    v = v.strip()
    return v if v else None

def _env_str(name: str, default: str) -> str:
    return _env_opt(name) or default

def _env_int(name: str, default: int) -> int:
    v = _env_opt(name)
    if v is None:
        return default
    try:
        return int(v)
    except Exception:
        return default

def _env_bool(name: str, default: bool) -> bool:
    v = _env_opt(name)
    if v is None:
        return default
    return v.lower() in {"1", "true", "yes", "y", "on"}

# =============================================================================
# Config (overridable by env)
# =============================================================================

BROKER: str = _env_str("WESMO_MQTT_BROKER", "localhost")
PORT: int = _env_int("WESMO_MQTT_PORT", 1883)

RAW_TOPIC: str = _env_str("WESMO_RAW_TOPIC", "/wesmo-data")      # simulator publishes here (leading /)
UI_TOPIC: str  = _env_str("WESMO_UI_TOPIC", "wesmo/telemetry")   # dashboard listens here (no /)

USERNAME: Optional[str] = _env_opt("WESMO_MQTT_USERNAME")
PASSWORD: Optional[str] = _env_opt("WESMO_MQTT_PASSWORD")

REDIS_ENABLED: bool = _env_bool("WESMO_ENABLE_REDIS", False)
DB_ENABLED: bool    = _env_bool("WESMO_ENABLE_DB", True)

# Watchdog for incoming frames (seconds)
TIMEOUT_SEC: int = _env_int("WESMO_TIMEOUT_SEC", 0)

# =============================================================================
# Globals
# =============================================================================

client_id = f"wesmo-sub-{random.randint(1000, 9999)}"
dash_pub_id = f"wesmo-dash-pub-{random.randint(1000, 9999)}"

# Translators
mc_translator = MCTranslator()
bms_translator = BMSTranslator()
vcu_translator = VCUTranslator()

# DB globals (loose typed to avoid stubs)
cursor: Any = None
conn: Any = None

# Redis (optional)
redis_client: Optional[Any] = None
_redis_warned = False

# MQTT publisher for UI
_dash_pub: Optional[mqtt_client.Client] = None

# Watchdog
timeout_timer: Optional[threading.Timer] = None
timed_out = False
nmt_operational: bool = True
# Names the UI tiles expect (normalize to these)
UI_NAME_MAP = {
    "battery voltage": "DC Voltage",
    "battery state of charge": "SoC",
    "soc": "SoC",
    "motor speed": "Motor Speed",
    "motor rpm": "Motor Speed",
    "controller temp": "Motor Temp",
    "controller temperature": "Motor Temp",
    "motor temperature": "Motor Temp",
    # optional: if you want pack temp to drive the Motor Temp tile when motor temp is absent:
    "battery temperature": "Motor Temp",
}

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

    # paho-mqtt v5 callback signature (properties added)
    def on_connect(c: mqtt_client.Client, u: Any, flags: Dict[str, Any], rc: int, properties: Any = None) -> None:
        log(f"[DASH] connected rc={rc} as {dash_pub_id}")

    pub.on_connect = on_connect
    pub.connect(BROKER, PORT, keepalive=30)
    pub.loop_start()
    _dash_pub = pub
    log(f"[DASH] publisher started -> topic '{UI_TOPIC}'")

def _normalize_name(name: str) -> str:
    key = name.strip()
    mapped = UI_NAME_MAP.get(key.lower(), key)
    return mapped

def _normalize_unit(unit: Any) -> str:
    unit_map = {"c": "degC", "C": "degC", "°C": "degC", "degc": "degC"}
    return unit_map.get(str(unit), str(unit) if unit is not None else "")

def publish_for_ui(name: str, value: Any, unit: Any = "", source: str = "CAN") -> None:
    """Publish a single UI row (safe if publisher not started)."""
    if _dash_pub is None or not name:
        return

    payload = {
        "ts": now_ms(),
        "source": source,
        "name": _normalize_name(str(name)),
        "value": float(value) if isinstance(value, (int, float)) else value,
        "unit": _normalize_unit(unit),
    }
    j = json.dumps(payload, separators=(",", ":"))
    _dash_pub.publish(UI_TOPIC, j, qos=0, retain=True)
    log(f"[PUB] {payload['name']} = {payload['value']} {payload['unit']}")

# =============================================================================
# Cache + Publish (safe)
# =============================================================================

def cache_data(time_parts: Iterable[str], value: Dict[str, Any]) -> None:
    """
    Safe cache + publish:
      - Always publish to the dashboard so UI updates even if Redis is down.
      - Optionally cache the latest value in Redis when enabled.
    """
    # 1) Publish to UI first (don't let cache failures block UI)
    try:
        publish_for_ui(
            str(value.get("name", "")),
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
        redis_key = str(value.get("name", ""))
        redis_val = {
            "time": " ".join(list(time_parts)[1:3]) if time_parts else "",
            "name": value.get("name", ""),
            "value": value.get("value", 0),
            "unit": value.get("unit", ""),
        }
        redis_client.set(redis_key, pickle.dumps(redis_val))
    except Exception as e:
        if not _redis_warned:
            log(f"[REDIS] cache disabled ({e})")
            _redis_warned = True

# =============================================================================
# Subscriber
# =============================================================================

def connect_subscriber() -> mqtt_client.Client:
    sub = mqtt_client.Client(
        client_id=client_id,
        protocol=mqtt_client.MQTTv311,
        transport="tcp",
    )
    if USERNAME:
        sub.username_pw_set(USERNAME, PASSWORD or None)

    def on_connect(c: mqtt_client.Client, u: Any, flags: Dict[str, Any], rc: int, properties: Any = None) -> None:
        if rc == 0:
            log(f"[MQTT] connected to {BROKER}:{PORT}")
        else:
            log(f"[MQTT] failed rc={rc}")

    sub.on_connect = on_connect
    sub.connect(BROKER, PORT, keepalive=30)
    return sub

def reset_timeout() -> None:
    global timeout_timer, timed_out
    if TIMEOUT_SEC <= 0:
        return
    if timeout_timer:
        timeout_timer.cancel()
    timeout_timer = threading.Timer(float(TIMEOUT_SEC), _on_timeout)
    timeout_timer.daemon = True
    timeout_timer.start()
    if timed_out:
        timed_out = False
        log("[WATCHDOG] activity resumed")

def _on_timeout() -> None:
    global timed_out
    if TIMEOUT_SEC <= 0:
       return
    if not nmt_operational:
       # Suppress during non-operational state
       log("[WATCHDOG] idle, NMT not operational – ignored")
       return
    timed_out = True
    log(f"[WATCHDOG] timeout (no raw frames for {TIMEOUT_SEC}s)")
    # Optional: mark bridge idle in UI
    try:
       publish_for_ui("Bridge Idle", 1, "", source="BRIDGE")
    except Exception:
      pass
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
    ...
    # Publish each numeric row to UI
    for r in rows:
        name = r.get("name")
        value = r.get("value")
        unit = r.get("unit", "")
       # Track VCU NMT state (value 0/1)
        if label == "VCU" and isinstance(name, str) and name.strip().lower() == "nmt is operational":
           try:
               globals()["nmt_operational"] = bool(value)
           except Exception:
               pass
        if name and isinstance(value, (int, float)):
            publish_for_ui(str(name), value, unit, source=label)

    # DB persists (optional)
    if DB_ENABLED and cursor and conn:
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

    # Publish each numeric row to UI
    for r in rows:
        name = r.get("name")
        value = r.get("value")
        unit = r.get("unit", "")
        if name and isinstance(value, (int, float)):
            publish_for_ui(str(name), value, unit, source=label)

def subscribe(sub: mqtt_client.Client) -> None:
    def on_message(client: mqtt_client.Client, userdata: Any, msg: Any) -> None:
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

    # --- DB (optional) ---
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

    # --- Redis (optional) ---
    redis_client = start_redis()

    # --- MQTT publisher for the UI topic (wesmo/telemetry) ---
    start_dash_publisher()

    # --- Raw subscriber for simulator frames (/wesmo-data) ---
    if TIMEOUT_SEC > 0:
        reset_timeout()
        log(f"[WATCHDOG] enabled ({TIMEOUT_SEC}s)")
    else:
        log("[WATCHDOG] disabled (WESMO_TIMEOUT_SEC=0)")

    sub = connect_subscriber()
    subscribe(sub)
    sub.loop_forever()


    # DB (optional)
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
