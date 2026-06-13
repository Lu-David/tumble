from flask import (
    Blueprint,
    jsonify
)

from state.dryer_state import (
    dryer_state,
    state_lock
)

bp = Blueprint(
    "status",
    __name__
)

@bp.route("/status")
def status():

    with state_lock:
        dryer = dict(
            dryer_state
        )

    return jsonify({
        "dryer": dryer,
        "washer": {
            "status": None
        }
    })