""" 
    This file is to simulate the Raspberry Pi sending CAN data over MQTT.
    Used for testing of the backend system.
"""

import random
import time
from paho.mqtt import client as mqtt_client

""" GLOBAL VARIABLES
Set the Parameter of MQTT Broker Connection
Set the address, port and topic of MQTT Broker connection. 
At the same time, we call the Python function random.randint 
to randomly generate the MQTT client id.
"""
broker = "3.107.68.65"
port = 1883
topic = "/wesmo-data"
client_id = f"wesmo-{random.randint(0, 100)}"
username = "wesmo"
password = "public"


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


def publish(client):
    """_summary_
    Publishes CAN messages to the MQTT broker.
        Args:
            client (mqtt_client): The publisher object connected to the AWS broker.
    """
    with open("data/can_str_test.txt", "r") as file:
        while True:
            msg = ""
            for line in file:
                result = client.publish(topic, line.strip())
                status = result[0]
                if status != 0:
                    print(f"Failed to send message to topic {topic}")
                else:
                    print(line.strip())
                time.sleep(1)


def main():
    connected = False
    while not connected:
        client = connect_mqtt()
        print(client)
        if client != None:
            client.loop_start()
            publish(client)


if __name__ == "__main__":
    main()