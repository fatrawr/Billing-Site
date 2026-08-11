"""
Single Flask app for the whole ConsumerInfoDb web backend.
As you migrate more forms, you do NOT create a new Flask app per form —
you create one new *_routes.py blueprint file per form/module and register
it here. See the bottom of this file for the pattern.
"""

import os

from flask import Flask, jsonify, make_response, request
from flask_cors import CORS

from auth_routes import auth_bp
from charges_routes import charges_bp
from staff_routes import staff_bp
from dates_routes import dates_bp
from bills_routes import bills_bp
from bank_routes import bank_bp
from config_routes import config_bp
from customer_routes import consumers_bp
from payment_routes import payment_bp
from reading_routes import reading_bp
from werkzeug.exceptions import HTTPException

app = Flask(__name__)

app.secret_key = os.environ.get("FLASK_SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY environment variable is not set")


def _normalize_origin(origin: str) -> str:
    """Ensure origins are full URLs (scheme + host). Browsers always send that form."""
    origin = (origin or "").strip().rstrip("/")
    if not origin:
        return ""
    if origin.startswith("http://") or origin.startswith("https://"):
        return origin
    return f"https://{origin}"


def _allowed_origins():
    raw = os.environ.get(
        "FRONTEND_ORIGIN",
        "https://billing-thingy-b7b5-ten.vercel.app",
    )
    origins = [_normalize_origin(part) for part in raw.split(",")]
    origins = [o for o in origins if o]
    # Local Vite/React always allowed when not running on Vercel
    if os.environ.get("VERCEL") != "1":
        for local in ("http://localhost:3000", "http://127.0.0.1:3000"):
            if local not in origins:
                origins.append(local)
    return origins


ALLOWED_ORIGINS = _allowed_origins()

CORS(
    app,
    supports_credentials=True,
    origins=ALLOWED_ORIGINS,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def _apply_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Vary"] = "Origin"
    return response


@app.after_request
def add_cors_headers(response):
    return _apply_cors_headers(response)


@app.route("/api/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    # Explicit preflight response so browsers always get CORS headers
    return _apply_cors_headers(make_response("", 204))


app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(charges_bp, url_prefix="/api/charges")
app.register_blueprint(staff_bp, url_prefix="/api/staff")
app.register_blueprint(dates_bp, url_prefix="/api/dates")
app.register_blueprint(bills_bp, url_prefix="/api/bills")
app.register_blueprint(bank_bp, url_prefix="/api/bank")
app.register_blueprint(config_bp, url_prefix="/api/config")
app.register_blueprint(consumers_bp, url_prefix="/api/consumers")
app.register_blueprint(payment_bp, url_prefix="/api/payments")
app.register_blueprint(reading_bp, url_prefix="/api/readings")

# Secure cookies for HTTPS (Vercel). For local http://, cookies still work without Secure.
_is_prod = os.environ.get("VERCEL") == "1" or os.environ.get("FLASK_ENV") == "production"
app.config.update(
    SESSION_COOKIE_SECURE=_is_prod,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None" if _is_prod else "Lax",
)


@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e  # let Flask/Werkzeug handle its own 404/405/etc. normally
    app.logger.exception("Unhandled error")
    if app.debug:
        return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Something went wrong. Please try again."}), 500


# @app.errorhandler(Exception)
# def handle_exception(e):
#     app.logger.exception("Unhandled error")
#     if app.debug:
#         return jsonify({"error": str(e)}), 500
#     return jsonify({"error": "Something went wrong. Please try again."}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)