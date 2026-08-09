"""
Society Charges blueprint — the web equivalent of SecurityChargesForm.cs.
Register with: app.register_blueprint(charges_bp, url_prefix="/api/charges")

Data model note: each "row" the user sees (one Description) is actually up to
3 underlying rows in SoctyChargs_Tbl - one per Category ("2K", "1K", "10M").
That's exactly how the C# form grouped and rebuilt them, so we keep the same
shape here rather than restructuring the table.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request, session

from auth_utils import login_required
from database import SessionLocal
from models import SoctyChargsTbl

charges_bp = Blueprint("charges", __name__)

CATEGORIES = ["2K", "1K", "10M"]


def _group_rows(rows):
    """Group flat rows into one dict per Description, same as the C# GroupBy."""
    groups = {}
    for r in rows:
        g = groups.setdefault(r.Description, {"description": r.Description, "2K": "", "1K": "", "10M": ""})
        g[r.Category] = str(r.Amount)
    return sorted(groups.values(), key=lambda g: g["description"])


# ══════════════════════════════════════════════════════════════
# GET /api/charges   — grouped list, equivalent of LoadData()
# ══════════════════════════════════════════════════════════════
@charges_bp.route("", methods=["GET"])
#@login_required
def list_charges():
    db = SessionLocal()
    try:
        rows = db.query(SoctyChargsTbl).filter(SoctyChargsTbl.State != "D").all()
        return jsonify(_group_rows(rows)), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/charges   — equivalent of SaveNewRecord()
# body: { description, amounts: { "2K": "", "1K": "", "10M": "" } }
# ══════════════════════════════════════════════════════════════
@charges_bp.route("", methods=["POST"])
@login_required
def add_charge():
    data = request.get_json(silent=True) or {}
    description = (data.get("description") or "").strip()
    amounts = data.get("amounts") or {}

    if not description:
        return jsonify({"error": "Description is required."}), 400

    provided = {k: v for k, v in amounts.items() if k in CATEGORIES and str(v).strip() != ""}
    if not provided:
        return jsonify({"error": "Enter at least one amount (2K, 1K, or 10 Marla)."}), 400

    for k, v in provided.items():
        try:
            int(v)
        except (TypeError, ValueError):
            return jsonify({"error": f"{k} amount must be a whole number."}), 400

    db = SessionLocal()
    try:
        now = datetime.now()
        for category, amount in provided.items():
            db.add(SoctyChargsTbl(
                Description=description, Amount=int(amount), Category=category,
                State=" ", UserID=session["user_id"], Date=now.date(), Time=now.time(),
            ))
        db.commit()
        return jsonify({"message": "Record added successfully!"}), 201
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# PUT /api/charges   — equivalent of btnSave.Click in BuildDisplayRow
# body: { description, amounts: { "2K": "", "1K": "", "10M": "" } }
# Deletes existing rows for this description, reinserts with new amounts.
# ══════════════════════════════════════════════════════════════
@charges_bp.route("", methods=["PUT"])
@login_required
def update_charge():
    data = request.get_json(silent=True) or {}
    description = (data.get("description") or "").strip()
    amounts = data.get("amounts") or {}

    if not description:
        return jsonify({"error": "Description is required."}), 400

    for k, v in amounts.items():
        if k in CATEGORIES and str(v).strip() != "":
            try:
                int(v)
            except (TypeError, ValueError):
                return jsonify({"error": f"{k} amount must be a whole number."}), 400

    db = SessionLocal()
    try:
        existing = db.query(SoctyChargsTbl).filter_by(Description=description).all()
        for r in existing:
            db.delete(r)
        db.commit()

        now = datetime.now()
        for category in CATEGORIES:
            value = str(amounts.get(category, "")).strip()
            if value:
                db.add(SoctyChargsTbl(
                    Description=description, Amount=int(value), Category=category,
                    State=" ", UserID=session["user_id"], Date=now.date(), Time=now.time(),
                ))
        db.commit()
        return jsonify({"message": "Record updated successfully!"}), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# DELETE /api/charges   — equivalent of db.Click (soft delete) in display row
# body: { description }
# ══════════════════════════════════════════════════════════════
@charges_bp.route("", methods=["DELETE"])
@login_required
def delete_charge():
    data = request.get_json(silent=True) or {}
    description = (data.get("description") or "").strip()

    if not description:
        return jsonify({"error": "Description is required."}), 400

    db = SessionLocal()
    try:
        rows = db.query(SoctyChargsTbl).filter_by(Description=description).all()
        if not rows:
            return jsonify({"error": "No matching record found."}), 404

        now = datetime.now()
        for r in rows:
            r.State = "D"
            r.UserID = session["user_id"]
            r.Date = now.date()
            r.Time = now.time()
        db.commit()
        return jsonify({"message": "Deleted successfully!"}), 200
    finally:
        db.close()