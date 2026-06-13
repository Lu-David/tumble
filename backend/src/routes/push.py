from flask import (
    Blueprint,
    jsonify
)

from services.push_service import (
    send_push
)

bp = Blueprint(
    "push",
    __name__
)

@bp.route(
    "/test-push",
    methods=["POST"]
)
def test_push():

    send_push(
        "Test notification 🔔"
    )

    return jsonify({
        "sent": True
    })