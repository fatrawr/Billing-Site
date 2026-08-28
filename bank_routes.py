"""
Bank Information blueprint — web equivalent of BankInfoForm.cs.
Register with: app.register_blueprint(bank_bp, url_prefix="/api/bank")
"""

from datetime import datetime

from flask import Blueprint, jsonify, request, session

from auth_utils import login_required
from database import SessionLocal
from models import BankInfoTbl

bank_bp = Blueprint("bank", __name__)


def _validate(db, name, acct, exclude_id=None):
    if not name.strip():
        return "Bank Name is required."
    if len(acct.strip()) != 16 or not acct.strip().isdigit():
        return "Account # must be exactly 16 digits."
    query = db.query(BankInfoTbl).filter(BankInfoTbl.AccountNo == acct.strip())
    if exclude_id is not None:
        query = query.filter(BankInfoTbl.Id != exclude_id)
    if query.first():
        return "Account # already exists."
    return None


@bank_bp.route("", methods=["GET"])
#@login_required
def list_banks():
    db = SessionLocal()
    try:
        rows = (
            db.query(BankInfoTbl)
            .filter(BankInfoTbl.State != "D")
            .order_by(BankInfoTbl.BankName)
            .all()
        )
        return jsonify([r.to_dict() for r in rows]), 200
    finally:
        db.close()


@bank_bp.route("", methods=["POST"])
@login_required
def add_bank():
    data = request.get_json(silent=True) or {}
    name = (data.get("bankName") or "").strip()
    acct = (data.get("accountNo") or "").strip()

    db = SessionLocal()
    try:
        error = _validate(db, name, acct)
        if error:
            return jsonify({"error": error}), 400

        now = datetime.now()
        db.add(BankInfoTbl(
            BankName=name, AccountNo=acct, State=" ",
            UserID=session["user_id"], Date=now.date(), Time=now.time(),
        ))
        db.commit()
        return jsonify({"message": "Record added successfully!"}), 201
    finally:
        db.close()


@bank_bp.route("", methods=["PUT"])
@login_required
def update_bank():
    data = request.get_json(silent=True) or {}
    record_id = data.get("id")
    name = (data.get("bankName") or "").strip()
    acct = (data.get("accountNo") or "").strip()

    db = SessionLocal()
    try:
        error = _validate(db, name, acct, exclude_id=record_id)
        if error:
            return jsonify({"error": error}), 400

        record = db.query(BankInfoTbl).filter_by(Id=record_id).first()
        if record is None:
            return jsonify({"error": "Record not found."}), 404

        record.BankName = name
        record.AccountNo = acct
        db.commit()
        return jsonify({"message": "Updated successfully!"}), 200
    finally:
        db.close()


@bank_bp.route("", methods=["DELETE"])
@login_required
def delete_bank():
    data = request.get_json(silent=True) or {}
    record_id = data.get("id")

    db = SessionLocal()
    try:
        record = db.query(BankInfoTbl).filter_by(Id=record_id).first()
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