import json
import logging

from pywebpush import webpush

from config import (
    VAPID_PRIVATE_KEY,
    VAPID_CLAIMS
)

from services.db import get_db

logger = logging.getLogger(__name__)

def send_push(message):

    conn = get_db()

    subs = conn.execute(
        "SELECT * FROM subscriptions"
    ).fetchall()

    conn.close()

    payload = {
        "title": "Tumble",
        "body": message
    }

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint":
                        sub["endpoint"],
                    "keys": {
                        "p256dh":
                            sub["p256dh"],
                        "auth":
                            sub["auth"]
                    }
                },
                data=json.dumps(payload),
                vapid_private_key=
                    VAPID_PRIVATE_KEY,
                vapid_claims=
                    VAPID_CLAIMS
            )

        except Exception as e:
            logger.error(
                "Push failed:",
                e
            )