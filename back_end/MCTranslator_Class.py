import datetime


class MCTranslator:
    def __init__(self):
        pass

    def decode(self, can_data):
        can_data = can_data.split()
        dl = int(can_data[7])

        values = [
            can_data[1],
            can_data[3],
            str(dl),
            "".join(can_data[8 : 8 + dl]),
            can_data[8 + dl + 1],
        ]

        return self.decode_pdo(values)

    def interpret_signed_int(self, value, bit_size):
        max_unsigned = 1 << bit_size
        max_signed = max_unsigned >> 1
        if value >= max_signed:
            value -= max_unsigned
        return value

    def decode_mc_pdo_4(self, can_data):
        if len(can_data) != 16 and len(can_data) != 14:
            print(f"Invalid PDO 4 message length {can_data}")

        torque_regulator = self.interpret_signed_int(
            int(can_data[2:4] + can_data[0:2], 16), 16
        )
        flux_regulator_count = self.interpret_signed_int(
            int(can_data[6:8] + can_data[4:6], 16), 16
        )
        if len(can_data) == 14:
            velocity_actual_value = self.interpret_signed_int(
                int(can_data[12:14] + can_data[10:12] + can_data[8:10], 16), 16
            )
        else:
            velocity_actual_value = self.interpret_signed_int(
                int(
                    can_data[16:14]
                    + can_data[12:14]
                    + can_data[10:12]
                    + can_data[8:10],
                    16,
                ),
                32,
            )

        return [
            {"name": "torque regulator", "value": torque_regulator, "unit": ""},
            {"name": "flux regulator count", "value": flux_regulator_count, "unit": ""},
            {
                "name": "velocity actual value",
                "value": velocity_actual_value,
                "unit": "",
            },
        ]

    def decode_mc_pdo_3(self, can_data):
        if len(can_data) != 12 and len(can_data) != 16:
            print(f"Invalid PDO 3 message length {can_data}")
        motor_current_actual = self.interpret_signed_int(
            int(can_data[2:4] + can_data[0:2], 16), 16
        )
        electrical_angle = self.interpret_signed_int(
            int(can_data[6:8] + can_data[4:6], 16), 16
        )
        phase_a_current = self.interpret_signed_int(
            int(can_data[10:12] + can_data[8:10], 16), 16
        )

        data = [
            f"motor current actual: {motor_current_actual}",
            f"electrical angle: {electrical_angle}",
            f"phase a current: {phase_a_current}",
        ]

        data = [
            {
                "name": "motor current actual",
                "value": motor_current_actual,
                "unit": "A",
            },
            {"name": "electrical angle", "value": electrical_angle, "unit": ""},
            {
                "name": "phase a current",
                "value": phase_a_current,
                "unit": "A",
            },
        ]

        if len(can_data) == 16:
            phase_b_current = self.interpret_signed_int(
                int(can_data[16:14] + can_data[12:14], 16), 16
            )
            data += [
                {
                    "name": "phase b current",
                    "value": phase_b_current,
                    "unit": "A",
                }
            ]

        return data

    def decode_mc_pdo_2(self, can_data):
        if len(can_data) != 16:
            print(f"Invalid PDO 2 message length {can_data}")

        controller_temp = self.interpret_signed_int(int(can_data[0:2], 16), 8)
        motor_temp = int(can_data[2:4], 16)
        DC_link_circuit_voltage = self.interpret_signed_int(
            int(can_data[6:8] + can_data[4:6], 16), 16
        )
        logic_power_supply_voltage = self.interpret_signed_int(
            int(can_data[10:12] + can_data[8:10], 16), 16
        )
        current_demand = self.interpret_signed_int(
            int(can_data[16:14] + can_data[12:14], 16), 16
        )
        # return [
        #     f"controller temp:{controller_temp}",
        #     f"motor temp:{motor_temp}",
        #     f"DC link circuit voltage:{DC_link_circuit_voltage}",
        #     f"logic power supply voltage:{logic_power_supply_voltage}",
        #     f"current demand:{current_demand}",
        # ]
        return [
            {"name": "controller temp", "value": controller_temp, "unit": "c"},
            {"name": "motor temp", "value": motor_temp, "unit": ""},
            {
                "name": "DC link circuit voltage",
                "value": DC_link_circuit_voltage,
                "unit": "V",
            },
            {
                "name": "logic power supply voltage",
                "value": logic_power_supply_voltage,
                "unit": "V",
            },
            {
                "name": "current demand",
                "value": current_demand,
                "unit": "A",
            },
        ]

    def decode_mc_pdo_1(self, can_data):
        if len(can_data) != 16:
            print(f"Invalid PDO 1 message length {can_data}")

        status_word = int(can_data[2:4] + can_data[0:2], 16)
        position_actual_value = self.interpret_signed_int(
            int(can_data[10:12] + can_data[8:10] + can_data[6:8] + can_data[4:6], 16),
            32,
        )
        torque_actual_value = self.interpret_signed_int(
            int(can_data[16:14] + can_data[12:14], 16), 16
        )

        return [
            {"name": "status word", "value": status_word, "unit": ""},
            {"name": "position actual", "value": position_actual_value, "unit": ""},
            {
                "name": "torque actual",
                "value": torque_actual_value,
                "unit": "",
            },
        ]

    def decode_pdo(self, can_data):

        data = [f"time: {datetime.datetime.fromtimestamp(float(can_data[0]))}"]

        if can_data[1] == "181" or can_data[1] == "0181":
            data += "1"
            data += self.decode_mc_pdo_1(can_data[3])
        elif can_data[1] == "281" or can_data[1] == "0281":
            data += "2"
            data += self.decode_mc_pdo_2(can_data[3])
        elif can_data[1] == "381" or can_data[1] == "0381":
            data += "3"
            data += self.decode_mc_pdo_3(can_data[3])
        elif can_data[1] == "481" or can_data[1] == "0481":
            data += "4"
            data += self.decode_mc_pdo_4(can_data[3])
        else:
            return None
        return data