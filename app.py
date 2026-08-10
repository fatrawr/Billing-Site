"""
Single Flask app for the whole ConsumerInfoDb web backend.
As you migrate more forms, you do NOT create a new Flask app per form —
you create one new *_routes.py blueprint file per form/module and register
it here. See the bottom of this file for the pattern.
"""

import os

from flask import Flask, jsonify
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

app = Flask(__name__)

app.secret_key = os.environ.get("FLASK_SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY environment variable is not set")

CORS(app, supports_credentials=True, origins=[os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")])

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

app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None",
)


@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.exception("Unhandled error")
    if app.debug:
        return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Something went wrong. Please try again."}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)