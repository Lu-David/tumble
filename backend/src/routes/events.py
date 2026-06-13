from flask import (
    Blueprint,
    jsonify,
    request
)

from services.db import (
    get_db
)

bp = Blueprint(
    "events",
    __name__
)

@bp.route("/events")
def events():

    page = request.args.get(
        "page",
        1,
        type=int
    )

    limit = request.args.get(
        "limit",
        20,
        type=int
    )

    offset = (
        page - 1
    ) * limit

    conn = get_db()

    rows = conn.execute("""
        SELECT *
        FROM events
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
    """,
    (
        limit,
        offset
    )).fetchall()

    total = conn.execute(
        """
        SELECT COUNT(*)
        FROM events
        """
    ).fetchone()[0]

    conn.close()

    return jsonify({
        "events":
            [dict(r) for r in rows],
        "page": page,
        "limit": limit,
        "total": total
    })