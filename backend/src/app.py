import logging

from flask import Flask
from flask_cors import CORS

from routes.health import bp as health_bp
from routes.status import bp as status_bp
from routes.events import bp as events_bp
from routes.subscriptions import (
    bp as subscriptions_bp
)
from routes.push import bp as push_bp

from services.db import init_db
from services.dryer_monitor import (
    start_monitor
)

logging.basicConfig(
    format=(
        "%(asctime)s - "
        "%(levelname)s - "
        "%(message)s"
    ),
    level=logging.INFO
)

app = Flask(__name__)
CORS(app, origins=["https://lu-david.github.io"])

init_db()

app.register_blueprint(
    health_bp
)

app.register_blueprint(
    status_bp
)

app.register_blueprint(
    events_bp
)

app.register_blueprint(
    subscriptions_bp
)

app.register_blueprint(
    push_bp
)

with app.app_context():
    start_monitor()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        threaded=True
    )