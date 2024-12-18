"""
File: BMSTranslatorClass.py
Author: Hannah Murphy
Date: 2024
Description: The translating class for data sent from the BMS.

Copyright (c) 2024 WESMO. All rights reserved.
This code is part of the WESMO Data Acquisition and Visualisation Project.

"""

import cantools
import datetime
from enum import Enum
from collections import deque

last_10_currents = deque(maxlen=10)


class Status(Enum):
    VOLTAGE = 1
    CURRENT = 2
    RELAY = 4
    CELL_BALENCING = 8
    CHARGE_INTERLOCK = 16
    THERMISTOR_B_VALUE_INVALID = 32
    INPUT_POWER_SUPPLY = 64
    RESERVED = 128


class BMSTranslator:
    def __init__(self):
        pass

    def decode(self, can_data):
        predictive_soc = 0
        try:
            dbc = cantools.database.load_file("dbc/bms.dbc")
            can_data = can_data.split()
            can_data = can_data[:-2]
            dl = int(can_data[7])
            data_list = can_data[8 : 8 + dl]
            if len(data_list) != dl:
                return []

            id = int(can_data[3], 16)
            data = bytearray.fromhex("".join(data_list))
            decoded_message = dbc.decode_message(id, data)
            data = [f"time: {datetime.datetime.fromtimestamp(float(can_data[1]))}"]

            if(decoded_message["Pack_Current"] != 0 and decoded_message["Pack_Summed_Voltage"] != 0 and decoded_message["Pack_SOC"] != 0):
                predictive_soc = self.predict_soc(
                    decoded_message["Pack_Current"],
                    decoded_message["Pack_Summed_Voltage"],
                    decoded_message["Pack_SOC"],
                )

        except Exception as e:
            print(f" -! # Error translating bms data: {e}")

        return data + [
            {
                "name": "Battery Temperature",
                "value": decoded_message["High_Temperature"],
                "unit": "c",
                "max": 60,
            },
            {
                "name": "Battery Current",
                "value": round(decoded_message["Pack_Current"], 2),
                "unit": "A",
                "max": 100,
            },
            {
                "name": "Battery State of Charge",
                "value": round(decoded_message["Pack_SOC"], 2),
                "unit": "%",
                "max": 100,
            },
            {
                "name": "Battery Voltage",
                "value": round(decoded_message["Pack_Summed_Voltage"],2),
                "unit": "V",
                "max": 100,
            },
            {
                "name": "Battery DCL",  # discharge current limit
                "value": decoded_message["Maximum_Pack_DCL"],
                "unit": "A",
                "max": 80,
            },
            {
                "name": "Battery Status",
                "value": decoded_message["Failsafe_Statuses"],
                "unit": "",
                "max": 100,
            },
            {
                "name": "Battery Checksum",
                "value": decoded_message["CRC_Checksum"],
                "unit": "",
                "max": 100,
            },
            {
                "name": "Predictive State of Charge",
                "value": predictive_soc,
                "unit": "Hours",
                "max": 100,
            },
        ]

    def index_failsafe_status(self, value):
        set_flags = []

        for status in Status:
            if value & status.value:
                set_flags.append(status.name)

        return set_flags

    def predict_soc(self, pack_current, pack_inst_voltage, pack_soc):
        max_pack_current = 6

        last_10_currents.append(pack_current)
        avg_pack_current = sum(last_10_currents) / len(last_10_currents)

        avg_power = avg_pack_current * pack_inst_voltage
        current_kwh = pack_soc * max_pack_current

        return round(current_kwh / avg_power)
