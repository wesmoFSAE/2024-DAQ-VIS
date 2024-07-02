import random

from paho.mqtt import client as mqtt_client


broker = "3.107.68.65" # IP of broker instance
port = 1883
topic = "/wesmo-data"
# generate client ID with pub prefix randomly
client_id = f"wesmo-{random.randint(0, 100)}"
username = "wesmo"
password = "public"


def connect_mqtt() -> mqtt_client:
    def on_connect(client, userdata, flags, reason_code, properties=None):
        if reason_code == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", reason_code)

    client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2, client_id)
    client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client


"""Subscribe
    Write the message callback function on_message. 
    This function will be called after the client received
    messages from the MQTT Broker. In this function, 
    we will print out the name of subscribed topics and the 
    received messages."""


def subscribe(client: mqtt_client):
    def on_message(client, userdata, msg):
        print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")

    client.subscribe(topic)
    client.on_message = on_message


def run():
    client = connect_mqtt()
    subscribe(client)
    client.loop_forever()


if __name__ == "__main__":
    run()
