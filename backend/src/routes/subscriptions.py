from flask import (
    Blueprint,
    request,
    jsonify
)

from services.db import (
    get_db
)

from config import (
    VAPID_PUBLIC_KEY
)

bp = Blueprint(
    "subscriptions",
    __name__
)

@bp.route(
    "/vapidPublicKey"
)
def vapid_key():

    return jsonify({
        "publicKey":
            VAPID_PUBLIC_KEY
    })


@bp.route(
    "/subscribe",
    methods=["POST"]
)
def subscribe():

    data = request.get_json()

    conn = get_db()

    conn.execute(
        """
        INSERT INTO subscriptions
        (endpoint,p256dh,auth)
        VALUES (?, ?, ?)
        """,
        (
            data["endpoint"],
            data["keys"]
            ["p256dh"],
            data["keys"]
            ["auth"]
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "ok": True
    })