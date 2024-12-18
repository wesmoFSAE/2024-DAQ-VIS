#!/usr/bin/env python3
"""
File: rpi_main.py
Author: Hannah Murphy
Date: 2024-09-14
Description: Python3 script to set up and run the Raspberry Pi for CAN Bus telemetry.
    Runs automatically when the WESMO Raspberry Pi boots.

Copyright (c) 2024 WESMO. All rights reserved.
This code is part of the WESMO Data Acquisition and Visualisation Project.

Usage: Python3 rpi_main.py
"""

import os
import can
import random
from paho.mqtt import client as mqtt_client
from can.exceptions import CanInitializationError

""" GLOBAL VARIABLES
Set the Parameter of MQTT Broker Connection
Set the address, port and topic of MQTT Broker connection. 
At the same time, we call the Python function random.randint 
to randomly generate the MQTT client id.
"""
broker = "52.64.83.72"
port = 1883
topic = "/wesmo-data"
username = "wesmo"
password = "public"
client_id = f"wesmo-{random.randint(0, 1000)}"


def create_device():
    """_summary_
    Function to create a CAN device on the Raspberry Pi.
    Retuns a CAN device object if successful or None if failed.
    Returns:
        bus: CAN-BUS interface or None
    """
    try:
        os.system("sudo ip link set can0 type can bitrate 500000")
        os.system("sudo ifconfig can0 up")
        return can.interface.Bus(channel="can0", interface="socketcan")

    except CanInitializationError as e:
        print(f"Failed to initialize CAN bus: {e.message}")
        if e.error_code is not None:
            print(f"Error code: {e.error_code}")
        return None
    except Exception as e:
        print("Failure to set up can devices:", e)
        return None


def shutdown_device():
    """_summary_
    Shuts down the CAN device on the Raspberry Pi.
    """
    try:
        os.system("sudo ifconfig can0 down")
    except Exception as e:
        print("Failure to shutdown can devices:", e)


def connect_mqtt() -> mqtt_client:
    """_summary_
    Connects to the MQTT broker and returns the client object.
    The MQTT broker is hosted on an AWS EC2 instance.
        Returns:
            mqtt_client: The publisher object connected to the AWS broker
    """
    client = None
    try:

        def on_connect(client, userdata, flags, reason_code, properties=None):
            if reason_code == 0:
                print("connected to MQTT")
                connected = True
            if reason_code != 0:
                print("Failed to connect, return code %d\n", reason_code)

        client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2, client_id)
        client.username_pw_set(username, password)
        client.on_connect = on_connect
        client.connect(broker, port)
        return client
    except Exception as e:
        print("Issue connecting:", e)
    finally:
        return client


def publish(client, can0):
    """_summary_
    Publishes CAN messages to the MQTT broker.
        Args:
            client (mqtt_client): The publisher object connected to the AWS broker.
            can0 (can.interface.Bus): The CAN-BUS interface object.
    """
    while True:
        msg = can0.recv(0.0)
        # Only send MC, BMS and specific VCU Messages
        if("ID:      181" in msg
            or "ID:      281" in msg
            or "ID:      381" in msg
            or "ID:      481" in msg
            or "ID:      04d" in msg
            or "ID:      010" in msg
            or "ID:      012" in msg
            or "ID:      011" in msg
        ):
            result = client.publish(topic, str(msg))
        # status = result[0]


def main():
    """_summary_
    --- Main loop ---
    1. Shutdown the CAN device, if there are any
    2. Create a CAN device
    3. Connect to the MQTT broker
    4. Publish CAN messages to the MQTT broker continuously
    """
    shutdown_device()
    can0 = create_device()

    if not can0:
        shutdown_device()

    connected = False
    while not connected:
        client = connect_mqtt()
        print(client)
        if client != None:
            client.loop_start()
            publish(client, can0)


if __name__ == "__main__":
    main()
