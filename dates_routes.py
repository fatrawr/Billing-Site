"""
Billing Schedule blueprint — web equivalent of DatesForm.cs.
Register with: app.register_blueprint(dates_bp, url_prefix="/api/dates")

The frontend uses native <input type="month"> and <input type="date">
fields instead of the C# form's segmented DD/MM/YYYY boxes - that's a
deliberate improvement (browser-native pickers, no manual masking needed)
rather than a literal port. Everything sent over the wire is plain ISO:
month as "YYYY-MM", dates as "YYYY-MM-DD".
"""

from datetime import date, datetime

from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import IntegrityError

from auth_utils import admin_required, login_required
from database import SessionLocal
from models import DatesTbl
import re

dates_bp = Blueprint("dates", __name__)

_ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
def _parse_date(value):
    if not value or not _ISO_DATE_RE.match(value):
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None

def _parse_month(value):
    """'YYYY-MM' -> int YYYYMM, or None if invalid."""
    try:
        yyyy_str, mm_str = value.split("-")
        yyyy, mm = int(yyyy_str), int(mm_str)
        if mm < 1 or mm > 12 or yyyy < 2000:
            return None
        return int(f"{yyyy:04d}{mm:02d}")
    except (ValueError, AttributeError):
        return None


def _parse_date(value):
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None


def _month_display(month):
    yyyy, mm = month // 100, month % 100
    return date(yyyy, mm, 1).strftime("%b-%Y")


def _is_month_past(month):
    yyyy, mm = month // 100, month % 100
    row_month = date(yyyy, mm, 1)
    today = date.today()
    return row_month < date(today.year, today.month, 1)


def _validate_dates_against_month(month, rdg, iss, due):
    """Same rules as ValidateDatesAgainstMonth in the C# form - including its
    quirk of comparing only the .Month component (not the full date/year)
    when checking against the target month. Kept as-is to match existing
    behavior; flag to product owner if this should also check year."""
    target_month = month % 100
    
    yyyy, mm = month // 100, month % 100
    next_mm, next_yyyy = (1, yyyy + 1) if mm == 12 else (mm + 1, yyyy)
    allowed = {(yyyy, mm), (next_yyyy, next_mm)}

    if (rdg.year, rdg.month) not in allowed:
        return "Reading/Issue/Due month must be the same as, or one month after, the Bill Month."
    if not (rdg.year == iss.year == due.year and rdg.month == iss.month == due.month):
        return "Reading, Issue, and Due dates must all fall in the same month and year."
    #if rdg.month < target_month or iss.month < target_month or due.month < target_month:
      #  return "Reading, Issue, and Due dates must be greater than Bill Month."
    if not (rdg < iss < due):
        return "Dates must be in order: Reading Date < Issue Date < Due Date."
    return None


def _row_to_dict(row):
    return {
        "month": row.Month,
        "monthDisplay": _month_display(row.Month),
        "rdgDate": row.rdg_dt.isoformat(),
        "issDate": row.iss_dt.isoformat(),
        "dueDate": row.due_dt.isoformat(),
        "monthPassed": _is_month_past(row.Month),
    }


# ══════════════════════════════════════════════════════════════
# GET /api/dates   — equivalent of LoadData(), sorted chronologically
# ══════════════════════════════════════════════════════════════
@dates_bp.route("", methods=["GET"])
@login_required
def list_dates():
    db = SessionLocal()
    try:
        # Grab the 6 most recent months (Month is stored as YYYYMM, so a
        # plain numeric DESC sort is the most-recent-first order), then
        # flip back to ascending so the table still reads oldest-to-newest.
        rows = (
            db.query(DatesTbl)
            .order_by(DatesTbl.Month.desc())
            .limit(6)
            .all()
        )
        rows.reverse()
        return jsonify([_row_to_dict(r) for r in rows]), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/dates   — equivalent of SaveRecord()
# body: { month: "YYYY-MM", rdgDate, issDate, dueDate: "YYYY-MM-DD" }
# Note: the C# form does NOT block past months on Add (that check is
# commented out there) - only on Edit. Kept identical here.
# ══════════════════════════════════════════════════════════════
# @dates_bp.route("", methods=["POST"])
# @login_required
# def add_date():
#     data = request.get_json(silent=True) or {}
#     stored_month = _parse_month(data.get("month", ""))
#     rdg = _parse_date(data.get("rdgDate", ""))
#     iss = _parse_date(data.get("issDate", ""))
#     due = _parse_date(data.get("dueDate", ""))

#     if stored_month is None:
#         return jsonify({"error": "Month must be a valid MM/YYYY."}), 400
#     if rdg is None or iss is None or due is None:
#         return jsonify({"error": "Reading, Issue, and Due dates must all be valid dates."}), 400

#     error = _validate_dates_against_month(stored_month, rdg, iss, due)
#     if error:
#         return jsonify({"error": error}), 400

#     db = SessionLocal()
#     try:
#         if db.query(DatesTbl).filter_by(Month=stored_month).first():
#             return jsonify({"error": "A record for this month already exists."}), 409

#         now = datetime.now()
#         db.add(DatesTbl(
#             Month=stored_month, rdg_dt=rdg, iss_dt=iss, due_dt=due,
#             UserID=session["user_id"], Date=now.date(), Time=now.time(),
#         ))
#         db.commit()
#         return jsonify({"message": "Record added successfully!"}), 201
#     finally:
#         db.close()

@dates_bp.route("", methods=["POST"])
@admin_required
def add_date():
    data = request.get_json(silent=True) or {}
    stored_month = _parse_month(data.get("month", ""))
    rdg = _parse_date(data.get("rdgDate", ""))
    iss = _parse_date(data.get("issDate", ""))
    due = _parse_date(data.get("dueDate", ""))

    if stored_month is None:
        return jsonify({"error": "Month must be a valid MM/YYYY."}), 400
    if rdg is None or iss is None or due is None:
        return jsonify({"error": "Reading, Issue, and Due dates must all be valid dates."}), 400

    error = _validate_dates_against_month(stored_month, rdg, iss, due)
    if error:
        return jsonify({"error": error}), 400

    db = SessionLocal()
    try:
        # if db.query(DatesTbl).filter_by(Month=stored_month).first():
        #     return jsonify({"error": "A record for this month already exists."}), 409

        now = datetime.now()
        db.add(DatesTbl(
            Month=stored_month, rdg_dt=rdg, iss_dt=iss, due_dt=due,
            UserID=session["user_id"], Date=now.date(), Time=now.time(),
        ))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return jsonify({"error": "A record for this month already exists."}), 409

        return jsonify({"message": "Record added successfully!"}), 201
    finally:
        db.close()



# ══════════════════════════════════════════════════════════════
# PUT /api/dates   — equivalent of btnSave.Click in BuildRow
# body: { oldMonth: int, month: "YYYY-MM", rdgDate, issDate, dueDate }
# If the month itself changed, this is a delete-then-insert (Month is the PK),
# same as the C# form's "can't modify a tracked PK in place" comment.
# ══════════════════════════════════════════════════════════════
# @dates_bp.route("", methods=["PUT"])
# @login_required
# def update_date():
#     data = request.get_json(silent=True) or {}
#     old_month = data.get("oldMonth")
#     stored_month = _parse_month(data.get("month", ""))
#     rdg = _parse_date(data.get("rdgDate", ""))
#     iss = _parse_date(data.get("issDate", ""))
#     due = _parse_date(data.get("dueDate", ""))

#     if stored_month is None:
#         return jsonify({"error": "Month must be a valid MM/YYYY."}), 400
#     if rdg is None or iss is None or due is None:
#         return jsonify({"error": "Reading, Issue, and Due dates must all be valid dates."}), 400
#     if _is_month_past(stored_month):
#         return jsonify({"error": "Month cannot be earlier than the current month."}), 400

#     error = _validate_dates_against_month(stored_month, rdg, iss, due)
#     if error:
#         return jsonify({"error": error}), 400

#     db = SessionLocal()
#     try:
#         duplicate = (
#             db.query(DatesTbl)
#             .filter(DatesTbl.Month == stored_month, DatesTbl.Month != old_month)
#             .first()
#         )
#         if duplicate:
#             return jsonify({"error": "A record for this month already exists."}), 409

#         existing = db.query(DatesTbl).filter_by(Month=old_month).first()
#         if existing is None:
#             return jsonify({"error": "Record not found."}), 404

#         now = datetime.now()
#         if stored_month == old_month:
#             existing.rdg_dt = rdg
#             existing.iss_dt = iss
#             existing.due_dt = due
#             existing.UserID = session["user_id"]
#             existing.Date = now.date()
#             existing.Time = now.time()
#         else:
#             db.delete(existing)
#             db.flush()
#             db.add(DatesTbl(
#                 Month=stored_month, rdg_dt=rdg, iss_dt=iss, due_dt=due,
#                 UserID=session["user_id"], Date=now.date(), Time=now.time(),
#             ))
#         db.commit()
#         return jsonify({"message": "Updated successfully!"}), 200
#     finally:
#         db.close()

@dates_bp.route("", methods=["PUT"])
@admin_required
def update_date():
    data = request.get_json(silent=True) or {}
    old_month = data.get("oldMonth")
    stored_month = _parse_month(data.get("month", ""))
    rdg = _parse_date(data.get("rdgDate", ""))
    iss = _parse_date(data.get("issDate", ""))
    due = _parse_date(data.get("dueDate", ""))

    if stored_month is None:
        return jsonify({"error": "Month must be a valid MM/YYYY."}), 400
    if rdg is None or iss is None or due is None:
        return jsonify({"error": "Reading, Issue, and Due dates must all be valid dates."}), 400
    if _is_month_past(stored_month):
        return jsonify({"error": "Month cannot be earlier than the current month."}), 400

    error = _validate_dates_against_month(stored_month, rdg, iss, due)
    if error:
        return jsonify({"error": error}), 400

    db = SessionLocal()
    try:
        # duplicate = (
        #     db.query(DatesTbl)
        #     .filter(DatesTbl.Month == stored_month, DatesTbl.Month != old_month)
        #     .first()
        # )
        # if duplicate:
        #     return jsonify({"error": "A record for this month already exists."}), 409

        existing = db.query(DatesTbl).filter_by(Month=old_month).first()
        if existing is None:
            return jsonify({"error": "Record not found."}), 404

        now = datetime.now()
        try:
            if stored_month == old_month:
                existing.rdg_dt = rdg
                existing.iss_dt = iss
                existing.due_dt = due
                existing.UserID = session["user_id"]
                existing.Date = now.date()
                existing.Time = now.time()
            else:
                db.delete(existing)
                db.flush()
                db.add(DatesTbl(
                    Month=stored_month, rdg_dt=rdg, iss_dt=iss, due_dt=due,
                    UserID=session["user_id"], Date=now.date(), Time=now.time(),
                ))
            db.commit()
        except IntegrityError:
            db.rollback()
            return jsonify({"error": "A record for this month already exists."}), 409

        return jsonify({"message": "Updated successfully!"}), 200
    finally:
        db.close()


