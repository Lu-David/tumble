from smbus2 import SMBus
import struct
import random
import logging

from config import *

logger = logging.getLogger(__name__)

bus = None

if not MOCK_I2C:
    bus = SMBus(1)
    bus.write_byte_data(
        MPU_ADDR,
        PWR_MGMT_1,
        0
    )
else:
    logger.info(
        "MOCK_I2C enabled"
    )


def read_accel():

    if MOCK_I2C or bus is None:
        base = 16000
        noise = random.randint(
            -500,
            500
        )

        return (
            base + noise,
            base + noise,
            base + noise
        )

    data = bus.read_i2c_block_data(
        MPU_ADDR,
        ACCEL_XOUT_H,
        14
    )

    ax, ay, az, _, _, _, _ = (
        struct.unpack(
            ">hhhhhhh",
            bytes(data)
        )
    )

    return ax, ay, az