"""
File: mqtt_subscriber.py
Author: Hannah Murphy
Date: 2024
Description: Run by the main app server, contains all MQTT and Redis relevent methods.

Copyright (c) 2024 WESMO. All rights reserved.
This code is part of the WESMO Data Acquisition and Visualisation Project.

"""

import requests
import threading
import random
import redis
import pickle
import datetime
from paho.mqtt import client as mqtt_client
from MCTranslatorClass import MCTranslator
from BMSTranslatorClass import BMSTranslator
from VCUTranslatorClass import VCUTranslator
from database import (
    start_postgresql,
    setup_db,
    connect_to_db,
    create_mc_table,
    save_to_db_mc,
    save_to_db_bms,
    create_bms_table,
    create_vcu_table,
    save_to_db_vcu,
)


""" GLOBAL VARIABLES
Set the Parameter of MQTT Broker Connection
Set the address, port and topic of MQTT Broker connection. 
At the same time, we call the Python function random.randint 
to randomly generate the MQTT client id.
"""
broker = "32.236.81.167"
port = 1883
topic = "/wesmo-data"
client_id = f"wesmo-{random.randint(0, 100)}"
username = "wesmo"
password = "public"
client_list = []

TIMEOUT = 30
timeout_timer = None
is_timed_out = False

""" COMPONENT TRANSLATORS """
mc_translator = MCTranslator()
bms_translator = BMSTranslator()
vcu_translator = VCUTranslator()


"""
        REDIS
"""


def start_redis():
    r = redis.Redis(host="localhost", port=6379, db=0)
    return r


def query_all_latest_data():
    redis_client = redis.Redis(host="localhost", port=6379, db=0)
    keys = redis_client.keys("*")
    all_data = []
    for key in keys:
        data = redis_client.get(key)
        if data:
            try:
                deserialized_data = pickle.loads(data)
                all_data.append(
                    {
                        "time": deserialized_data["time"],
                        "name": deserialized_data["name"],
                        "value": deserialized_data["value"],
                        "unit": deserialized_data["unit"],
                    }
                )
            except pickle.PickleError as e:
                print(f"{datetime.datetime.now()} -! # Error deserializing data for key {key}: {e}")
        else:
            print(f"{datetime.datetime.now()} -! #  No data found for key {key}")
    return all_data


def query_latest(data_name):
    redis_client = redis.Redis(host="localhost", port=6379, db=0)
    data = redis_client.get(data_name)
    if data:
        try:
            deserialized_data = pickle.loads(data)
            latest_data = {
                "time": deserialized_data.get("time", ""),
                "name": deserialized_data.get("name", ""),
                "value": deserialized_data.get("value", ""),
                "unit": deserialized_data.get("unit", ""),
            }
            return latest_data
        except pickle.PickleError as e:
            print(f"{datetime.datetime.now()} -! # Error deserializing data for {data_name}: {e}")
    else:
        print(f"{datetime.datetime.now()} -! # No data found for {data_name}")
        return None


def cache_data(time, value):
    redis_client = redis.Redis(host="localhost", port=6379, db=0)
    try:
        redis_key = value["name"]
        redis_value = {
            "time": time[1] + " " + time[2],
            "name": value["name"],
            "value": value["value"],
            "unit": value["unit"],
        }
        redis_client.set(
            redis_key,
            pickle.dumps(redis_value),
        )
    except Exception as e:
        print(f"{datetime.datetime.now()} -! # Error with {redis_key}: {e}")


def query_data(data_name, cursor, conn):
    try:
        if (
            data_name == "Motor Temperature"
            or data_name == "Motor Speed"
            or data_name == "DC Link Circuit Voltage"
        ):
            query = f"SELECT time, value from MOTOR_CONTROLLER where name = '{data_name}' ORDER BY time DESC LIMIT 50;"
        elif data_name == "Wheel Speed":
            query = f"SELECT time, value, name FROM VEHICLE_CONTROLL_UNIT WHERE name IN ('Wheel Speed RR', 'Wheel Speed RL', 'Wheel Speed FR', 'Wheel Speed FL') ORDER BY time DESC LIMIT 50;"
        elif data_name == "Brakes and APPS":
            query = f"SELECT time, value, name FROM VEHICLE_CONTROLL_UNIT WHERE name IN ('Break Pressure Rear', 'Break Pressure Front', 'Accelerator Travel 1', 'Accelerator Travel 2') ORDER BY time DESC LIMIT 50;"
        elif (
            data_name == "Battery Temperature"
            or data_name == "Battery Current"
            or data_name == "Battery State of Charge"
            or data_name == "Battery Voltage"
            or data_name == "Battery Power"
            or data_name == "Battery DCL"
            or data_name == "Battery Status"
            or data_name == "Battery Checksum"
            or data_name == "Predictive State of Charge"
        ):
            query = f"SELECT time, value from BATTERY_MANAGEMENT_SYSTEM where name = '{data_name}' ORDER BY time DESC LIMIT 50;"
        else:
            print(f"{datetime.datetime.now()} -! #  ERROR: Data '{data_name}' does not exist in database.")

        cursor.execute(query)
        data = cursor.fetchall()
        converted_data = []

        if data_name == "Wheel Speed" or data_name == "Brakes and APPS":
            for dt, value, name in data:
                timestamp = int(dt.timestamp())
                converted_data.append(
                    {"timestamp": timestamp, "value": value, "name": name.strip()}
                )
        else:
            for dt, value in data:
                timestamp = int(dt.timestamp())
                converted_data.append({"timestamp": timestamp, "value": value})
        return converted_data
    except Exception as e:
        print(f"{datetime.datetime.now()} -! # Error collecting data from: {e}")


"""
        MQTT
"""


def connect_mqtt() -> mqtt_client:
    """_summary_
    Connects to the MQTT broker and returns the client object.
    The MQTT broker is hosted on an AWS EC2 instance.
        Returns:
            mqtt_client: The publisher object connected to the AWS broker
    """

    def on_connect(client, userdata, flags, reason_code, properties=None):
        if reason_code != 0:
            print("Failed to connect, return code %d\n", reason_code)

    client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2, client_id)
    client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client


def subscribe(client: mqtt_client, redis_client):
    """_summary_
    Subscribes to the CAN messages using MQTT.
    Print out any received messages to the console and to a text file.
        Args:
            client (mqtt_client): The publisher object connected to the AWS broker.
    """

    def on_message(client, userdata, msg):
        global is_timed_out
        reset_timeout()
        if is_timed_out:
            on_timeout(False)
        data = []
        raw_data = msg.payload.decode()

        if raw_data != "None":
            # Motor Controller
            if (
                "ID:      181" in raw_data
                or "ID:      281" in raw_data
                or "ID:      381" in raw_data
                or "ID:      481" in raw_data
            ):
                data = mc_translator.decode(raw_data)
                if data != []:
                    save_to_db_mc(cursor, conn, data, data[1])

            # Battery Management System
            if (
                "ID:      04d" in raw_data
            ):
                data = bms_translator.decode(raw_data)
                if data != []:
                    save_to_db_bms(cursor, conn, data)

            # Vehicle Control Unit
            elif (
                "ID:      010" in raw_data
                or "ID:      011" in raw_data
                or "ID:      012" in raw_data
                or "ID:      201" in raw_data
            ):
                data = vcu_translator.decode(raw_data)

                if data is not None:
                    if len(data) > 1:
                        save_to_db_vcu(cursor, conn, data)

    client.subscribe(topic)
    client.on_message = on_message


def reset_timeout():
    global timeout_timer
    if timeout_timer:
        timeout_timer.cancel()
    timeout_timer = threading.Timer(TIMEOUT, lambda: on_timeout(True))
    timeout_timer.start()


def on_timeout(timeout):
    global is_timed_out, redis_client
    url = "http://localhost:5001/timeout"
    is_timed_out = not is_timed_out
    redis_client.flushdb()
    try:
        response = requests.post(
            url, json={"timeout": timeout}, headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            print(f"{datetime.datetime.now()} -! # Failed: {response.status_code} - {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"{datetime.datetime.now()} -! # Error making request: {e}")


def start_mqtt_subscriber():
    # Connect & Set up DB
    global cursor, conn, redis_client
    cursor, conn = start_postgresql()
    setup_db(cursor, conn)
    cursor, conn = connect_to_db()

    # Create DB tables
    create_mc_table(cursor, conn)
    create_bms_table(cursor, conn)
    create_vcu_table(cursor, conn)

    global is_timed_out
    is_timed_out = False
    # Initialize Redis connection
    redis_client = start_redis()

    # Set up MQTT communications
    reset_timeout()
    client = connect_mqtt()
    subscribe(client, redis_client)
    client.loop_forever()


def main():
    start_mqtt_subscriber()


if __name__ == "__main__":
    main()
