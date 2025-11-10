"""
File: mqtt_subscriber.py
Purpose:
  - Subscribe to raw CAN-over-MQTT frames from the simulator on /wesmo-data.
  - Decode (BMS/MC/VCU) with your translators.
  - (Optionally) persist to Postgres.
  - Publish flat JSON rows for the React dashboard on 'wesmo/telemetry'.
  - Compute & publish pre-fault detections:
      * Numeric flags on 'wesmo/telemetry' (e.g., "FAULT DC Voltage" = 0/1)
      * Structured events on 'wesmo/faults' (Alerts list in UI)

UI payload shape:
  Telemetry row:
    {"ts": 1711111111111, "source": "BMS|MC|VCU|CAN|TEST", "name": "...", "value": 123.4, "unit": "degC"}

  Fault event:
    {"ts": 1711111111111, "kind":"fault_event", "name":"...", "status":"WARN_HIGH|FAULT_HIGH|FAULT_LOW|RESOLVED",
     "value": 123.4, "source":"BMS|MC|VCU", "message":"..."}
"""

from __future__ import annotations

import datetime
import json
import os
import pickle
import random
import threading
import time
from typing import Any, Dict, Iterable, List, Optional

import paho.mqtt.client as mqtt_client  # paho-mqtt >= 2.0

# ---- Optional Redis ----
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
# Env helpers
# =============================================================================

def _env_opt(name: str) -> Optional[str]:
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

RAW_TOPIC: str = _env_str("WESMO_RAW_TOPIC", "/wesmo-data")     # simulator publishes here
UI_TOPIC: str  = _env_str("WESMO_UI_TOPIC", "wesmo/telemetry")  # dashboard listens here

USERNAME: Optional[str] = _env_opt("WESMO_MQTT_USERNAME")
PASSWORD: Optional[str] = _env_opt("WESMO_MQTT_PASSWORD")

REDIS_ENABLED: bool = _env_bool("WESMO_ENABLE_REDIS", False)
DB_ENABLED: bool    = _env_bool("WESMO_ENABLE_DB", True)

# Watchdog (seconds). 0 disables (safe default while debugging).
TIMEOUT_SEC: int = _env_int("WESMO_TIMEOUT_SEC", 0)

# Prefault detection
FAULTS_ENABLED: bool    = _env_bool("WESMO_ENABLE_FAULTS", True)
FAULT_TOPIC: str        = _env_str("WESMO_FAULT_TOPIC", "wesmo/faults")
COOLDOWN_SEC: float     = float(_env_int("WESMO_FAULT_COOLDOWN_SEC", 5))

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
cursor: Any = None
conn: Any = None

# Redis (optional)
redis_client: Optional[Any] = None
_redis_warned = False

# MQTT publisher for UI & faults
_dash_pub: Optional[mqtt_client.Client] = None

# Watchdog
timeout_timer: Optional[threading.Timer] = None
timed_out = False
nmt_operational: bool = True

# Names the UI tiles expect (normalize)
UI_NAME_MAP = {
    "battery voltage": "DC Voltage",
    "battery state of charge": "SoC",
    "soc": "SoC",
    "motor speed": "Motor Speed",
    "motor rpm": "Motor Speed",
    "controller temp": "Motor Temp",
    "controller temperature": "Motor Temp",
    "motor temperature": "Motor Temp",
    "battery temperature": "Motor Temp",
}

# ---- Prefault normalization keys ----
FAULT_ALIASES = {
    "motor temp": "Motor Temperature",
    "motor temperature": "Motor Temperature",
    "controller temp": "Motor Temperature",
    "controller temperature": "Motor Temperature",
    "motor speed": "Motor Speed",
    "battery current": "Battery Current",
    "battery voltage": "Battery Voltage",
    "dc link circuit voltage": "DC Link Circuit Voltage",
    "battery state of charge": "Battery State of Charge",
    "soc": "Battery State of Charge",
    "brake pressure front": "Brake Pressure Front",
    "break pressure front": "Brake Pressure Front",
    "brake pressure rear": "Brake Pressure Rear",
    "break pressure rear": "Brake Pressure Rear",
    "wheel speed fl": "Wheel Speed FL",
    "wheel speed fr": "Wheel Speed FR",
    "wheel speed rl": "Wheel Speed RL",
    "wheel speed rr": "Wheel Speed RR",
}

# Reasonable defaults (tune for your car)
FAULT_THRESHOLDS = {
    "Battery Temperature":         {"max": 60,  "min": -10},  # °C
    "Battery Voltage":             {"max": 336, "warn": 320, "min": 180},   # V
    "Battery Current":             {"max": 240, "warn": 200, "min": -50},   # A
    "Battery State of Charge":     {"max": 100, "min": 0},                  # %
    "Motor Temperature":           {"max": 90,  "warn": 80},                # °C
    "Motor Speed":                 {"max": 12000, "warn": 10000},           # rpm
    "DC Link Circuit Voltage":     {"max": 450, "warn": 420, "min": 150},   # V
    "Accelerator Travel 1":        {"max": 100, "min": 0},                  # %
    "Accelerator Travel 2":        {"max": 100, "min": 0},                  # %
    "Brake Pressure Front":        {"max": 120, "warn": 100, "min": 0},     # bar
    "Brake Pressure Rear":         {"max": 120, "warn": 100, "min": 0},     # bar
    "Wheel Speed FL":              {"max": 250, "warn": 220, "min": 0},     # km/h
    "Wheel Speed FR":              {"max": 250, "warn": 220, "min": 0},
    "Wheel Speed RL":              {"max": 250, "warn": 220, "min": 0},
    "Wheel Speed RR":              {"max": 250, "warn": 220, "min": 0},
}

_last_fault_status: Dict[str, str] = {}   # name -> "OK" | WARN_HIGH | FAULT_HIGH | FAULT_LOW
_last_emit_time: Dict[tuple, float] = {}  # (name, status) -> ts

# =============================================================================
# Utilities
# =============================================================================

def log(msg: str) -> None:
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")

def now_ms() -> int:
    return int(time.time() * 1000)

def _normalize_name(name: str) -> str:
    key = name.strip()
    return UI_NAME_MAP.get(key.lower(), key)

def _fault_key(name: str) -> str:
    k = name.strip().lower()
    return FAULT_ALIASES.get(k, name.strip())

def _normalize_unit(unit: Any) -> str:
    unit_map = {"c": "degC", "C": "degC", "°C": "degC", "degc": "degC"}
    return unit_map.get(str(unit), str(unit) if unit is not None else "")

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
# UI / Fault publishers
# =============================================================================

def start_dash_publisher() -> None:
    """Dedicated MQTT client used to publish UI messages and faults."""
    global _dash_pub
    pub = mqtt_client.Client(
        client_id=dash_pub_id,
        protocol=mqtt_client.MQTTv311,
        transport="tcp",
    )
    if USERNAME:
        pub.username_pw_set(USERNAME, PASSWORD or None)

    def on_connect(c: mqtt_client.Client, u: Any, flags: Dict[str, Any], rc: int, properties: Any = None) -> None:
        log(f"[DASH] connected rc={rc} as {dash_pub_id}")

    pub.on_connect = on_connect
    pub.connect(BROKER, PORT, keepalive=30)
    pub.loop_start()
    _dash_pub = pub
    log(f"[DASH] publisher started -> topics '{UI_TOPIC}', '{FAULT_TOPIC}'")

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

def _emit_fault_event(name: str, status: str, value: float, source: str, message: str) -> None:
    if _dash_pub is None:
        return
    payload = {
        "ts": now_ms(),
        "kind": "fault_event",
        "name": name,
        "status": status,  # WARN_HIGH | FAULT_HIGH | FAULT_LOW | RESOLVED
        "value": value,
        "source": source,
        "message": message,
    }
    _dash_pub.publish(FAULT_TOPIC, json.dumps(payload, separators=(",", ":")), qos=0, retain=False)

def _set_numeric_flag(name: str, active: bool) -> None:
    publish_for_ui(f"FAULT {name}", 1 if active else 0, "", source="FAULT")

# =============================================================================
# Prefault detection core
# =============================================================================

def check_and_publish_faults(rows: List[Dict[str, Any]], source: str) -> None:
    if not FAULTS_ENABLED or not rows:
        return
    now = time.time()

    for r in rows:
        raw_name = str(r.get("name", "")).strip()
        if not raw_name:
            continue
        norm = _fault_key(raw_name)
        limits = FAULT_THRESHOLDS.get(norm)
        if not limits:
            continue

        v = r.get("value")
        if not isinstance(v, (int, float)):
            continue
        value = float(v)

        max_v  = limits.get("max")
        min_v  = limits.get("min")
        warn_v = limits.get("warn")

        status = "OK"
        msg = ""

        if max_v is not None and value > max_v:
            status = "FAULT_HIGH"; msg = f"{norm} > {max_v}"
        elif warn_v is not None and value >= warn_v:
            status = "WARN_HIGH";  msg = f"{norm} ≥ {warn_v}"
        elif min_v is not None and value < min_v:
            status = "FAULT_LOW";  msg = f"{norm} < {min_v}"

        prev = _last_fault_status.get(norm, "OK")
        should_emit = (status != prev)

        if not should_emit and status != "OK":
            last_t = _last_emit_time.get((norm, status), 0.0)
            if now - last_t >= COOLDOWN_SEC:
                should_emit = True

        # Transitions & numeric flags
        if should_emit:
            if status == "OK" and prev != "OK":
                _emit_fault_event(norm, "RESOLVED", value, source, f"{norm} back to nominal")
                _set_numeric_flag(norm, False)
            elif status != "OK":
                _emit_fault_event(norm, status, value, source, msg or status)
                _set_numeric_flag(norm, True)

            _last_fault_status[norm] = status
            _last_emit_time[(norm, status)] = now

        if status == "OK":
            _set_numeric_flag(norm, False)

# =============================================================================
# Cache + Publish (safe)  [Redis optional]
# =============================================================================

def cache_data(time_parts: Iterable[str], value: Dict[str, Any]) -> None:
    try:
        publish_for_ui(
            str(value.get("name", "")),
            value.get("value", 0),
            value.get("unit", ""),
            source="CAN",
        )
    except Exception as e:
        log(f"[PUB] error in cache_data publish: {e}")

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

    try:
        sub.reconnect_delay_set(min_delay=1, max_delay=10)
    except Exception:
        pass

    def on_connect(c: mqtt_client.Client, u: Any, flags: Dict[str, Any], rc: int, properties: Any = None) -> None:
        if rc == 0:
            log(f"[MQTT] connected to {BROKER}:{PORT}")
            try:
                c.subscribe(RAW_TOPIC, qos=0)
                log(f"[SUB] (re)subscribed to '{RAW_TOPIC}'")
            except Exception as e:
                log(f"[SUB] resubscribe failed: {e}")
            if TIMEOUT_SEC > 0:
                reset_timeout()
        else:
            log(f"[MQTT] failed rc={rc}")

    def on_disconnect(c: mqtt_client.Client, u: Any, rc: int, properties: Any = None) -> None:
        log(f"[MQTT] disconnected rc={rc}")

    sub.on_connect = on_connect
    sub.on_disconnect = on_disconnect
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
        log("[WATCHDOG] idle, NMT not operational – ignored")
        return
    timed_out = True
    log(f"[WATCHDOG] timeout (no raw frames for {TIMEOUT_SEC}s)")
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

    # Publish each numeric row to UI
    for r in rows:
        name = r.get("name")
        value = r.get("value")
        unit = r.get("unit", "")

        # Track VCU NMT state (0/1)
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
                pdo = decoded[1] if isinstance(decoded, list) and len(decoded) > 1 else None
                save_to_db_mc(cursor, conn, decoded, pdo)
            elif label == "VCU":
                save_to_db_vcu(cursor, conn, decoded)
        except Exception as e:
            log(f"[DB] write failed ({label}): {e}")

    # Prefault checks
    check_and_publish_faults(rows, source=label)

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

    redis_client = start_redis()
    start_dash_publisher()

    if TIMEOUT_SEC > 0:
        reset_timeout()
        log(f"[WATCHDOG] enabled ({TIMEOUT_SEC}s)")
    else:
        log("[WATCHDOG] disabled (WESMO_TIMEOUT_SEC=0)")

    sub = connect_subscriber()
    subscribe(sub)
    sub.loop_forever()

def main() -> None:
    start_mqtt_subscriber()

if __name__ == "__main__":
    main()
