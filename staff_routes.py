"""
Staff Phone Numbers blueprint — web equivalent of StaffPhoneForm.cs.
Register with: app.register_blueprint(staff_bp, url_prefix="/api/staff")
"""

from datetime import datetime

from flask import Blueprint, jsonify, request, session

from auth_utils import login_required
from database import SessionLocal
from models import StaffPhoneTbl

staff_bp = Blueprint("staff", __name__)


def _validate(name, phone):
    if not name.strip():
        return "Staff name is required."
    if len(phone.strip()) != 11 or not phone.strip().isdigit():
        return "Phone number must be exactly 11 digits."
    return None


# ══════════════════════════════════════════════════════════════
# GET /api/staff   — equivalent of LoadData()
# ══════════════════════════════════════════════════════════════
@staff_bp.route("", methods=["GET"])
def list_staff():
    db = SessionLocal()
    try:
        rows = (
            db.query(StaffPhoneTbl)
            .filter(StaffPhoneTbl.State != "D")
            .order_by(StaffPhoneTbl.StaffName)
            .all()
        )
        return jsonify([r.to_dict() for r in rows]), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/staff   — equivalent of SaveRecord()
# ══════════════════════════════════════════════════════════════
@staff_bp.route("", methods=["POST"])
@login_required
def add_staff():
    data = request.get_json(silent=True) or {}
    name = (data.get("staffName") or "").strip()
    phone = (data.get("phoneNumber") or "").strip()

    error = _validate(name, phone)
    if error:
        return jsonify({"error": error}), 400

    db = SessionLocal()
    try:
        now = datetime.now()
        db.add(StaffPhoneTbl(
            StaffName=name, PhoneNumber=phone, State=" ",
            UserID=session["user_id"], Date=now.date(), Time=now.time(),
        ))
        db.commit()
        return jsonify({"message": "Record added successfully!"}), 201
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# PUT /api/staff   — equivalent of btnSave.Click in BuildRow
# body: { id, staffName, phoneNumber }
# ══════════════════════════════════════════════════════════════
@staff_bp.route("", methods=["PUT"])
@login_required
def update_staff():
    data = request.get_json(silent=True) or {}
    record_id = data.get("id")
    name = (data.get("staffName") or "").strip()
    phone = (data.get("phoneNumber") or "").strip()

    error = _validate(name, phone)
    if error:
        return jsonify({"error": error}), 400

    db = SessionLocal()
    try:
        record = db.query(StaffPhoneTbl).filter_by(Id=record_id).first()
        if record is None:
            return jsonify({"error": "Record not found."}), 404

        now = datetime.now()
        record.StaffName = name
        record.PhoneNumber = phone
        record.UserID = session["user_id"]
        record.Date = now.date()
        record.Time = now.time()
        db.commit()
        return jsonify({"message": "Updated successfully!"}), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# DELETE /api/staff   — soft delete, equivalent of db.Click
# body: { id }
# ══════════════════════════════════════════════════════════════
@staff_bp.route("", methods=["DELETE"])
@login_required
def delete_staff():
    data = request.get_json(silent=True) or {}
    record_id = data.get("id")

    db = SessionLocal()
    try:
        record = db.query(StaffPhoneTbl).filter_by(Id=record_id).first()
        if record is None:
            return jsonify({"error": "Record not found."}), 404

        now = datetime.now()
        record.State = "D"
        record.UserID = session["user_id"]
        record.Date = now.date()
        record.Time = now.time()
        db.commit()
        return jsonify({"message": "Deleted successfully!"}), 200
    finally:
        db.close()