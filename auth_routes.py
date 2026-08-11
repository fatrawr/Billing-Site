"""
Auth blueprint — the web equivalent of SignUpForm.cs (all 4 views).
Register this on the main app with: app.register_blueprint(auth_bp, url_prefix="/api")
"""

import re
from datetime import date, datetime

import bcrypt
from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import SignUpTbl

auth_bp = Blueprint("auth", __name__)

ALLOWED_DEPARTMENTS = {"Electrical Engineering", "Admin", "Misc."}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
UID_RE   = re.compile(r"^[a-zA-Z0-9]+$")


def _err(msg, status=400):
    return jsonify({"error": msg}), status


# ══════════════════════════════════════════════════════════════
# POST /api/signup   — same validation as btnDo.Click in BuildSignUpView
# ══════════════════════════════════════════════════════════════
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    name       = (data.get("name") or "").strip()
    email      = (data.get("email") or "").strip()
    department = (data.get("department") or "").strip()
    user_id    = (data.get("userId") or "").strip()
    password   = data.get("password") or ""
    confirm    = data.get("confirmPassword") or ""

    # if len(name) < 5 or len(name) > 30:
    #     return _err("Name must be 5–30 characters.")
    if name.isdigit():
        return jsonify({"error": "Name cannot be only numbers."}), 400
    if not EMAIL_RE.match(email):
        return _err("Enter a valid email (e.g. user@email.com).")
    if department not in ALLOWED_DEPARTMENTS:
        return _err("Please select a department.")
    # if len(user_id) < 5 or len(user_id) > 15 or not UID_RE.match(user_id):
    #     return _err("User ID must be alphanumeric, max 5-15 chars.")
    if user_id.isdigit():
        return jsonify({"error": "User ID cannot be only numbers."}), 400
    if len(password) < 6 or len(password) > 15:
        return _err("Password must be 6–15 characters.")
    if password != confirm:
        return _err("Passwords do not match.")

    db = SessionLocal()
    try:
        uid_lower = user_id.lower()
        if db.query(SignUpTbl).filter_by(UserID=uid_lower).first():
            return _err("User ID already exists. Please choose another.")

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        now = datetime.now()

        record = SignUpTbl(
            UserID=uid_lower,
            Name=name,
            Email=email.lower(),
            Department=department,
            Password=hashed,
            Date=now.date(),
            Time=now.time(),
        )
        db.add(record)
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            msg = str(e.orig)
            if "chk_userlen_signup" in msg:
                return jsonify({"error": "Name must be between 5 and 30 characters."}), 400
            if "chk_useridlen_signup" in msg:
                return jsonify({"error": "User ID must be between 5 and 15 characters."}), 400
            return jsonify({"error": "User ID already exists. Please choose another."}), 409

        return jsonify({"message": "Account created successfully! Please log in."}), 201    
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/login   — same logic as btnLogin.Click in BuildLogInView
# ══════════════════════════════════════════════════════════════
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    # Must match signup, which stores UserID in lowercase
    user_id  = (data.get("userId") or "").strip().lower()
    password = data.get("password") or ""

    if not user_id or not password:
        return _err("Please fill in all fields.")

    db = SessionLocal()
    try:
        user = db.query(SignUpTbl).filter_by(UserID=user_id).first()
        if user is None:
            return _err("User not found. Please Sign Up first.", 404)

        if not bcrypt.checkpw(password.encode(), user.Password.encode()):
            return _err("Incorrect password.", 401)

        # web equivalent of Session.UserID / Session.UserName
        session["user_id"]   = user.UserID
        session["user_name"] = user.Name

        return jsonify({"message": "Logged in.", "user": user.to_dict()}), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/forgot-password   — same logic as btnReset.Click
# ══════════════════════════════════════════════════════════════
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    # Must match signup, which stores UserID in lowercase
    user_id = (data.get("userId") or "").strip().lower()
    new_pw  = data.get("newPassword") or ""
    confirm = data.get("confirmPassword") or ""

    if not user_id or not new_pw or not confirm:
        return _err("Please fill in all fields.")
    if len(new_pw) < 6 or len(new_pw) > 15:
        return _err("Password must be 6–15 characters.")
    if new_pw != confirm:
        return _err("Passwords do not match.")

    db = SessionLocal()
    try:
        user = db.query(SignUpTbl).filter_by(UserID=user_id).first()
        if user is None:
            return _err("User ID not found. Please Sign Up first.", 404)

        now = datetime.now()
        user.Password = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt()).decode()
        user.Date = now.date()
        user.Time = now.time()
        db.commit()
        return jsonify({"message": "Password reset successfully! Please log in."}), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/logout   +   GET /api/me   — session helpers for the frontend
# ══════════════════════════════════════════════════════════════
@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out."}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return _err("Not logged in.", 401)
    return jsonify({"userId": session["user_id"], "name": session["user_name"]}), 200