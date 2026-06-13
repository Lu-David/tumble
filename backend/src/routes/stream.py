from flask import (
    Blueprint,
    jsonify
)

stream_bp = Blueprint('stream', __name__)

@stream_bp.route('/stream')
def stream_data():
    def generate():
        for i in range(1, 11):
            yield f"Data chunk {i}\n"
            time.sleep(0.5)  # Simulate delay

    return Response(stream_with_context(generate()), content_type='text/plain')
