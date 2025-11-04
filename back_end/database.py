"""
File: database.py
Purpose:
  - Postgres helpers (create DB / tables, insert rows).
  - Each save_* function calls cache_data safely (with a fallback no-op) so the
    UI always receives telemetry, even when Redis is disabled.
"""

import psycopg2
from datetime import datetime

# -----------------------------------------------------------------------------
# DB Connections
# -----------------------------------------------------------------------------

def start_postgresql():
    conn = psycopg2.connect(
        database="postgres",
        user="postgres",
        password="password",
        host="127.0.0.1",
        port="5432",
    )
    conn.autocommit = True
    cursor = conn.cursor()
    return cursor, conn


def connect_to_db():
    conn = psycopg2.connect(
        database="wesmo",
        user="postgres",
        password="password",
        host="127.0.0.1",
        port="5432",
    )
    conn.autocommit = True
    cursor = conn.cursor()
    return cursor, conn


def setup_db(cursor, conn):
    try:
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'wesmo'")
        exists = cursor.fetchone()
        if not exists:
            cursor.execute("CREATE DATABASE wesmo")
            print(" # - Database created successfully")
        print(" # - Database already exists")
    except Exception:
        conn.rollback()
        print(" -! # Error creating database - wesmo")


# -----------------------------------------------------------------------------
# Tables
# -----------------------------------------------------------------------------

def create_mc_table(cursor, conn):
    try:
        cursor.execute("DROP TABLE IF EXISTS MOTOR_CONTROLLER")
        cursor.execute(
            """
            CREATE TABLE MOTOR_CONTROLLER(
                TIME TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                PDO INT,
                NAME CHAR(50),
                VALUE INT,
                UNIT CHAR(25),
                MAX CHAR(25)
            )
            """
        )
        print(" # - Motor Controller table created successfully")
        conn.commit()
    except Exception:
        conn.rollback()
        print(" -! # Error creating table - Motor Controller")


def create_vcu_table(cursor, conn):
    try:
        cursor.execute("DROP TABLE IF EXISTS VEHICLE_CONTROLL_UNIT")
        cursor.execute(
            """
            CREATE TABLE VEHICLE_CONTROLL_UNIT(
                TIME TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                NAME CHAR(50),
                VALUE INT,
                UNIT CHAR(25),
                MAX CHAR(25)
            )
            """
        )
        print(" # - Vehicle Control Unit table created successfully")
        conn.commit()
    except Exception:
        conn.rollback()
        print(" -! # Error creating table - Vehicle Control Unit")


def create_bms_table(cursor, conn):
    try:
        cursor.execute("DROP TABLE IF EXISTS BATTERY_MANAGEMENT_SYSTEM")
        cursor.execute(
            """
            CREATE TABLE BATTERY_MANAGEMENT_SYSTEM(
                TIME TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                NAME CHAR(50),
                VALUE INT,
                UNIT CHAR(25),
                MAX CHAR(25)
            )
            """
        )
        print(" # - Battery Management System table created successfully")
        conn.commit()
    except Exception:
        conn.rollback()
        print(" -! # Error creating table - Battery Management System")


# -----------------------------------------------------------------------------
# Safe cache_data import (no cyclic crash)
# -----------------------------------------------------------------------------

def _noop_cache_data(*args, **kwargs):
    pass

try:
    # Imported inside functions previously; importing once here is fine.
    from mqtt_subscriber import cache_data as _cache_data  # type: ignore
except Exception:
    _cache_data = _noop_cache_data


# -----------------------------------------------------------------------------
# Inserts (+ UI cache/publish)
# -----------------------------------------------------------------------------

def save_to_db_mc(cursor, conn, data, pdo):
    if len(data) < 2:
        return
    time_parts = data[0].split(" ")
    for value in data[2:]:
        query = f"""
            INSERT INTO MOTOR_CONTROLLER (TIME, PDO, NAME, VALUE, UNIT, MAX)
            VALUES ('{time_parts[1] + " " + time_parts[2]}',
                    {pdo},
                    '{value["name"]}',
                    {value["value"]},
                    '{value["unit"]}',
                    '{value["max"]}')
        """
        try:
            cursor.execute(query)
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f" -! # Error saving MC row: {e}")
        _cache_data(time_parts, value)


def save_to_db_vcu(cursor, conn, data):
    if len(data) < 2:
        return
    time_parts = data[0].split(" ")
    for value in data[1:]:
        if value["name"] != "Track Time":
            query = f"""
                INSERT INTO VEHICLE_CONTROLL_UNIT (TIME, NAME, VALUE, UNIT, MAX)
                VALUES ('{time_parts[1] + " " + time_parts[2]}',
                        '{value["name"]}',
                        {value["value"]},
                        '{value["unit"]}',
                        '{value["max"]}')
            """
            try:
                cursor.execute(query)
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f" -! # Error saving VCU row: {e}")
        _cache_data(time_parts, value)


def save_to_db_bms(cursor, conn, data):
    if len(data) < 2:
        return
    time_parts = data[0].split(" ")
    for value in data[1:]:
        query = f"""
            INSERT INTO BATTERY_MANAGEMENT_SYSTEM (TIME, NAME, VALUE, UNIT, MAX)
            VALUES ('{time_parts[1] + " " + time_parts[2]}',
                    '{value["name"]}',
                    {value["value"]},
                    '{value["unit"]}',
                    '{value["max"]}')
        """
        try:
            cursor.execute(query)
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f" -! # Error saving BMS row: {e}")
        _cache_data(time_parts, value)


# -----------------------------------------------------------------------------
# Optional: export + clear (same as before)
# -----------------------------------------------------------------------------

def export_and_clear_database(cursor, conn):
    # BMS
    cursor.execute("SELECT * FROM BATTERY_MANAGEMENT_SYSTEM")
    results = cursor.fetchall()
    date_time = datetime.now()
    formatted_date = f"{date_time.year}-{date_time.month:02d}-{date_time.day:02d}"
    filepath = f"./database/bms-{formatted_date}.txt"
    with open(filepath, "w") as f:
        for row in results:
            f.write("\t".join(str(cell) for cell in row) + "\n")
    cursor.execute("DELETE FROM BATTERY_MANAGEMENT_SYSTEM")
    conn.commit()

    # VCU
    cursor.execute("SELECT * FROM VEHICLE_CONTROLL_UNIT")
    results = cursor.fetchall()
    filepath = f"./database/vcu-{formatted_date}.txt"
    with open(filepath, "w") as f:
        for row in results:
            f.write("\t".join(str(cell) for cell in row) + "\n")
    cursor.execute("DELETE FROM VEHICLE_CONTROLL_UNIT")
    conn.commit()

    # MC
    cursor.execute("SELECT * FROM MOTOR_CONTROLLER")
    results = cursor.fetchall()
    filepath = f"./database/mc-{formatted_date}.txt"
    with open(filepath, "w") as f:
        for row in results:
            f.write("\t".join(str(cell) for cell in row) + "\n")
    cursor.execute("DELETE FROM MOTOR_CONTROLLER")
    conn.commit()
