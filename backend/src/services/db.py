import sqlite3
import os
from datetime import datetime

from config import (
    DB_DIR,
    DB_PATH
)

os.makedirs(DB_DIR, exist_ok=True)


def get_db():
    conn = sqlite3.connect(
        DB_PATH
    )

    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            machine TEXT,
            event TEXT,
            timestamp TEXT
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY,
            endpoint TEXT UNIQUE,
            p256dh TEXT,
            auth TEXT
        )
    """)

    conn.commit()
    conn.close()


def log_event(machine, event):
    conn = get_db()

    conn.execute(
        """
        INSERT INTO events
        (machine, event, timestamp)
        VALUES (?, ?, ?)
        """,
        (
            machine,
            event,
            datetime.now().isoformat()
        )
    )

    conn.commit()
    conn.close()