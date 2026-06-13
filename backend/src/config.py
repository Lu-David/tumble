import os
from dotenv import load_dotenv

load_dotenv()

MOCK_I2C = (
    os.getenv("MOCK_I2C", "false")
    .lower() == "true"
)

DB_DIR = "/app/data"
DB_PATH = os.path.join(
    DB_DIR,
    "tumble.db"
)

VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY"
)

VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY"
)

VAPID_CLAIMS = {
    "sub": os.getenv("VAPID_SUB")
}

MPU_ADDR = 0x68
PWR_MGMT_1 = 0x6B
ACCEL_XOUT_H = 0x3B