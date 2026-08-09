from functools import wraps

from flask import jsonify, session


def login_required(fn):
    """Equivalent of checking Session.UserID before letting a WinForms form open.
    Wrap any route with @login_required to require an active session."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Not logged in."}), 401
        return fn(*args, **kwargs)
    return wrapper