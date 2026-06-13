from threading import Thread
from collections import deque
import time
import math
import logging

from services.mpu6050 import (
    read_accel
)

from services.db import (
    log_event
)

from services.push_service import (
    send_push
)

from state.dryer_state import (
    dryer_state,
    state_lock
)

logger = logging.getLogger(__name__)

WINDOW_SIZE = 200
THRESHOLD = 300
SAMPLE_INTERVAL = 0.1

window = deque()


class DryerMonitor:

    def __init__(self):
        self.last_state = (
            "IDLE"
        )

        self.baseline = (
            self.calibrate()
        )

    def calibrate(self):

        logger.info(
            "Calibrating..."
        )

        samples = []

        for _ in range(WINDOW_SIZE):

            ax, ay, az = (
                read_accel()
            )

            mag = math.sqrt(
                ax * ax +
                ay * ay +
                az * az
            )

            samples.append(
                mag
            )

            time.sleep(SAMPLE_INTERVAL)

        baseline = (
            sum(samples)
            / len(samples)
        )

        logger.info(
            f"Baseline:"
            f"{baseline}"
        )

        return baseline

    def loop(self):

        logger.info(
            "Dryer monitor started"
        )

        while True:

            try:
                ax, ay, az = (
                    read_accel()
                )

                mag = math.sqrt(
                    ax * ax +
                    ay * ay +
                    az * az
                )

                vibration = abs(
                    mag
                    - self.baseline
                )

                window.append(
                    vibration
                )

                if len(window) > (
                    WINDOW_SIZE
                ):
                    window.popleft()

                avg = (
                    sum(window)
                    / len(window)
                )

                state = (
                    "RUNNING"
                    if avg >
                    THRESHOLD
                    else "IDLE"
                )

                if (
                    state
                    !=
                    self.last_state
                ):

                    if state == (
                        "RUNNING"
                    ):
                        log_event(
                            "dryer",
                            "STARTED"
                        )

                        send_push(
                            "Dryer started!"
                        )

                    else:
                        log_event(
                            "dryer",
                            "STOPPED"
                        )

                        send_push(
                            "Dryer stopped!"
                        )

                    self.last_state = (
                        state
                    )

                with state_lock:

                    dryer_state[
                        "status"
                    ] = state

                    dryer_state[
                        "vibration"
                    ] = int(
                        vibration
                    )

                    dryer_state[
                        "avg_vibration"
                    ] = int(avg)

            except Exception as e:
                logger.exception(e)

            time.sleep(
                SAMPLE_INTERVAL
            )


def start_monitor():

    monitor = DryerMonitor()

    thread = Thread(
        target=monitor.loop,
        daemon=True
    )

    thread.start()