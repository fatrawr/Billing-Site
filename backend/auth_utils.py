from functools import wraps

from flask import jsonify, session

from database import SessionLocal
from models import SignUpTbl

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Not logged in."}), 401
        db = SessionLocal()
        try:
            user = db.query(SignUpTbl).filter_by(UserID=user_id).first()
            if user is None or user.Role != "Admin":
                return jsonify({"error": "Admins only."}), 403
        finally:
            db.close()
        return fn(*args, **kwargs)
    return wrapper



def login_required(fn):
    """Equivalent of checking Session.UserID before letting a WinForms form open.
    Wrap any route with @login_required to require an active session."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Not logged in."}), 401
        return fn(*args, **kwargs)
    return wrapper