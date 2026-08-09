"""
Config Information blueprint — web equivalent of ConfigForm.cs.
Register with: app.register_blueprint(config_bp, url_prefix="/api/config")

Note: the C# form lets an edit change BOTH halves of the composite key
(Month and ConfigCode) by mutating them directly on a tracked entity found
via the OLD key - which EF Core does not actually support cleanly. Your own
notes call this exact pattern out elsewhere as a bug you fixed with a
delete-then-insert. This blueprint uses that same corrected pattern here for
consistency, rather than reproducing the original's likely-broken update.
"""

from datetime import date, datetime

from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from auth_utils import login_required
from database import SessionLocal
from models import ConfigTbl

config_bp = Blueprint("config", __name__)

ALLOWED_USER = "fat123"
CONFIG_CODES = ["UR", "CM", "SC", "LP", "OM"]
CONFIG_DEFAULTS = {"UR": 0, "CM": 0, "SC": 0, "LP": 10, "OM": 1}
CONFIG_DESCS = {
    "UR": "Residential Unit Rate",
    "CM": "Commercial Unit Rate",
    "SC": "Semi-Commercial Unit Rate",
    "LP": "LP % of Total Bill Amount",
    "OM": "OM charges",
}

import re

# _ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# def _parse_strict_date(value):
#     """Rejects malformed years (e.g. 5-digit or 3-digit) before they ever
#     reach date.fromisoformat, instead of trusting the browser's date picker."""
#     if not value or not _ISO_DATE_RE.match(value):
#         return None
#     try:
#         return date.fromisoformat(value)
#     except ValueError:
#         return None


def _error(message, status=400):
    return jsonify({"error": message}), status


# def _parse_month(value):
#     """'YYYY-MM' -> int YYYYMM, or None if invalid. Mirrors TryParseMonthYear's
#     'year cannot be less than 2025' rule."""
#     try:
#         yyyy_str, mm_str = value.split("-")
#         yyyy, mm = int(yyyy_str), int(mm_str)
#         if mm < 1 or mm > 12 or yyyy < 2025:
#             return None
#         return int(f"{yyyy:04d}{mm:02d}")
#     except (ValueError, AttributeError):
#         return None

def _parse_month(value):
    try:
        yyyy_str, mm_str = value.split("-")
        if len(yyyy_str) != 4:          # ← this is the only change
            return None
        yyyy, mm = int(yyyy_str), int(mm_str)
        if mm < 1 or mm > 12 or not str(yyyy).startswith("20"):
            return None
        return int(f"{yyyy:04d}{mm:02d}")
    except (ValueError, AttributeError):
        return None




def _month_display(month):
    yyyy, mm = month // 100, month % 100
    return date(yyyy, mm, 1).strftime("%b-%Y")


def _row_to_dict(row):
    d = row.to_dict()
    d["monthDisplay"] = _month_display(row.Month)
    return d


@config_bp.route("", methods=["GET"])
@login_required
def list_configs():
    db = SessionLocal()
    try:
        rows = (
            db.query(ConfigTbl)
            .order_by(ConfigTbl.Month.desc(), ConfigTbl.ConfigCode)
            .all()
        )
        return jsonify([_row_to_dict(r) for r in rows]), 200
    finally:
        db.close()


@config_bp.route("", methods=["POST"])
@login_required
def add_config():
    if session.get("user_id") != ALLOWED_USER:
        return _error("You're not authorized to access this page.", status=403)

    data = request.get_json(silent=True) or {}
    month = _parse_month(data.get("month", ""))
    code = (data.get("configCode") or "").strip()
    desc = (data.get("configDesc") or "").strip()
    value_raw = data.get("configValue")

    # if month is None:
    #     return jsonify({"error": "Month must be entered as MM/YYYY, year 2025 or later."}), 400
    if len(code) != 2:
        return jsonify({"error": "Config Code must contain exactly 2 characters."}), 400
    if not desc:
        return jsonify({"error": "Config Desc is required."}), 400
    # change this in both routes:
    if month is None:
        return jsonify({"error": "Month must be in YYYYMM format (e.g. 202501), year 2000 or later."}), 400
    try:
        value = float(value_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Config Value must be a valid number."}), 400

    db = SessionLocal()
    try:
        # if db.query(ConfigTbl).filter_by(Month=month, ConfigCode=code).first():
        #     return jsonify({"error": "A config with this Month and Config Code already exists."}), 409

        now = datetime.now()
        db.add(ConfigTbl(
            Month=month, ConfigCode=code, ConfigDesc=desc, ConfigValue=value,
            UserID =session["user_id"], Date=now.date(), Time=now.time(),
        ))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return jsonify({"error": "A record for this month already exists."}), 409
        return jsonify({"message": "Record added successfully!"}), 201
    finally:
        db.close()


@config_bp.route("", methods=["PUT"])
@login_required
def update_config():
    if session.get("user_id") != ALLOWED_USER:
        return _error("You're not authorized to access this page.", status=403)

    data = request.get_json(silent=True) or {}
    old_month = data.get("oldMonth")
    old_code = data.get("oldConfigCode")
    month = _parse_month(data.get("month", ""))
    code = (data.get("configCode") or "").strip()
    desc = (data.get("configDesc") or "").strip()
    value_raw = data.get("configValue")

    if month is None:
        return jsonify({"error": "Month must be entered as MM/YYYY, year 2025 or later."}), 400
    if len(code) != 2:
        return jsonify({"error": "Config Code must contain exactly 2 characters."}), 400
    if not desc:
        return jsonify({"error": "Config Desc is required."}), 400
    try:
        value = float(value_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Config Value must be a valid number."}), 400

    db = SessionLocal()
    try:
        key_changed = (month, code) != (old_month, old_code)
        if key_changed and db.query(ConfigTbl).filter_by(Month=month, ConfigCode=code).first():
            return jsonify({"error": "A config with this Month and Config Code already exists."}), 409

        existing = db.query(ConfigTbl).filter_by(Month=old_month, ConfigCode=old_code).first()
        if existing is None:
            return jsonify({"error": "Record not found."}), 404

        now = datetime.now()
        if not key_changed:
            existing.ConfigDesc = desc
            existing.ConfigValue = value
            existing.UserID  = session["user_id"]
            existing.Date = now.date()
            existing.Time = now.time()
        else:
            db.delete(existing)
            db.flush()
            db.add(ConfigTbl(
                Month=month, ConfigCode=code, ConfigDesc=desc, ConfigValue=value,
                UserID =session["user_id"], Date=now.date(), Time=now.time(),
            ))
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            msg = str(e.orig)
            if "chk_month_len" in msg:
                return jsonify({"error": "Month must b4 between 200000 and 209999"}), 400
            return jsonify({"error": "A record for this month already exists."}), 409
    
        return jsonify({"message": "Record added successfully!"}), 201    
    finally:
        db.close()


@config_bp.route("", methods=["DELETE"])
@login_required
def delete_config():
    if session.get("user_id") != ALLOWED_USER:
        return _error("You're not authorized to access this page.", status=403)

    data = request.get_json(silent=True) or {}
    month = data.get("month")
    code = data.get("configCode")

    db = SessionLocal()
    try:
        record = db.query(ConfigTbl).filter_by(Month=month, ConfigCode=code).first()
        if record is None:
            return jsonify({"error": "Record not found."}), 404

        # hard delete - Config_Tbl has no soft-delete State column, same as the C# form
        db.delete(record)
        db.commit()
        return jsonify({"message": "Deleted successfully!"}), 200
    finally:
        db.close()


@config_bp.route("/latest", methods=["GET"])
@login_required
def get_latest_config():
    db = SessionLocal()
    try:
        latest = db.query(func.max(ConfigTbl.Month)).scalar()
        if latest is None:
            return jsonify({"month": None, "monthDisplay": None, "rows": []}), 200

        rows = (db.query(ConfigTbl).filter_by(Month=latest)
                .order_by(ConfigTbl.ConfigCode).all())
        return jsonify({
            "month": latest,
            "monthDisplay": _month_display(latest),
            "rows": [_row_to_dict(r) for r in rows],
        }), 200
    finally:
        db.close()


@config_bp.route("/next-month", methods=["POST"])
@login_required
def add_next_month_config():
    if session.get("user_id") != ALLOWED_USER:
        return _error("You're not authorized to access this page.", status=403)

    db = SessionLocal()
    try:
        latest = db.query(func.max(ConfigTbl.Month)).scalar()
        if latest is None:
            today = date.today()
            next_month = today.year * 100 + today.month
        else:
            yyyy, mm = latest // 100, latest % 100 + 1
            if mm > 12:
                mm, yyyy = 1, yyyy + 1
            next_month = yyyy * 100 + mm

        if db.query(ConfigTbl).filter_by(Month=next_month).first():
            return jsonify({"error": f"Config for {_month_display(next_month)} already exists."}), 409

        now = datetime.now()
        for code in CONFIG_CODES:
            db.add(ConfigTbl(
                Month=next_month, ConfigCode=code, ConfigDesc=CONFIG_DESCS[code],
                ConfigValue=CONFIG_DEFAULTS[code],
                UserID=session["user_id"], Date=now.date(), Time=now.time(),
            ))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return jsonify({"error": "Config for this month already exists."}), 409

        rows = (db.query(ConfigTbl).filter_by(Month=next_month)
                .order_by(ConfigTbl.ConfigCode).all())
        return jsonify({
            "message": "Next month's config created!",
            "month": next_month,
            "monthDisplay": _month_display(next_month),
            "rows": [_row_to_dict(r) for r in rows],
        }), 201
    finally:
        db.close()

@config_bp.route("/bulk-save", methods=["POST"])
@login_required
def bulk_save_config():
    if session.get("user_id") != ALLOWED_USER:
        return _error("You're not authorized to access this page.", status=403)

    data = request.get_json(silent=True) or {}
    month = data.get("month")
    rows = data.get("rows") or []

    if month is None or not isinstance(month, int):
        return jsonify({"error": "Month is required."}), 400
    if not rows:
        return jsonify({"error": "No rows to save."}), 400

    parsed = []
    for r in rows:
        code = (r.get("configCode") or "").strip()
        desc = (r.get("configDesc") or "").strip()
        if len(code) != 2 or not desc:
            return jsonify({"error": f"Invalid row for code '{code}'."}), 400
        try:
            value = float(r.get("configValue"))
        except (TypeError, ValueError):
            return jsonify({"error": f"Config Value for {code} must be a valid number."}), 400
        parsed.append((code, desc, value))

    db = SessionLocal()
    try:
        existing = db.query(ConfigTbl).filter_by(Month=month).all()
        existing_by_code = {r.ConfigCode: r for r in existing}
        now = datetime.now()

        for code, desc, value in parsed:
            row = existing_by_code.get(code)
            if row:
                row.ConfigDesc = desc
                row.ConfigValue = value
                row.UserID = session["user_id"]
                row.Date = now.date()
                row.Time = now.time()
            else:
                db.add(ConfigTbl(
                    Month=month, ConfigCode=code, ConfigDesc=desc, ConfigValue=value,
                    UserID=session["user_id"], Date=now.date(), Time=now.time(),
                ))

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return jsonify({"error": "Could not save - a conflicting record exists."}), 409

        saved_rows = (db.query(ConfigTbl).filter_by(Month=month)
                      .order_by(ConfigTbl.ConfigCode).all())
        return jsonify({
            "message": "Saved successfully!",
            "month": month,
            "monthDisplay": _month_display(month),
            "rows": [_row_to_dict(r) for r in saved_rows],
        }), 200
    finally:
        db.close()


@config_bp.route("/value", methods=["PUT"])
@login_required
def update_config_value():
    if session.get("user_id") != ALLOWED_USER:
        return _error("You're not authorized to access this page.", status=403)

    data = request.get_json(silent=True) or {}
    month = data.get("month")
    code = data.get("configCode")
    try:
        value = float(data.get("configValue"))
    except (TypeError, ValueError):
        return jsonify({"error": "Config Value must be a valid number."}), 400

    db = SessionLocal()
    try:
        row = db.query(ConfigTbl).filter_by(Month=month, ConfigCode=code).first()
        if row is None:
            return jsonify({"error": "Record not found."}), 404

        now = datetime.now()
        row.ConfigValue = value
        row.UserID = session["user_id"]
        row.Date = now.date()
        row.Time = now.time()
        db.commit()
        return jsonify({"message": "Updated successfully!"}), 200
    finally:
        db.close()


@config_bp.route("/month/<int:month>", methods=["GET"])
@login_required
def get_config_for_month(month):
    db = SessionLocal()
    try:
        rows = (db.query(ConfigTbl).filter_by(Month=month)
                .order_by(ConfigTbl.ConfigCode).all())
        return jsonify({
            "month": month,
            "monthDisplay": _month_display(month),
            "rows": [_row_to_dict(r) for r in rows],
        }), 200
    finally:
        db.close()