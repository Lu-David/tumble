from threading import Lock

state_lock = Lock()

dryer_state = {
    "status": "IDLE",
    "vibration": 0,
    "avg_vibration": 0,
}