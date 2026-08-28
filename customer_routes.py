"""
Consumer Display + Update blueprint — web equivalent of DisplayForm.cs
(read-only "Display Record") and UpdateForm.cs ("Update Record").
Register with: app.register_blueprint(consumers_bp, url_prefix="/api/consumers")

IMPORTANT BEHAVIOR CARRIED OVER FROM THE C# FORMS (not a bug I introduced):
- GET /<ref>/display has a SIDE EFFECT: if the consumer has zero active
  meters, it soft-deletes the consumer (State='D') right there in the search
  handler, same as DisplayForm.SearchRecord() does. A read-only "view" causing
  a write is unusual, but that's what the original does, so it's preserved.

FLAGGED DISCREPANCY - not silently fixed:
- UpdateForm.cs's Size of Plot dropdown offers ("1K", "2K", "10 Marla") and
  stores whichever is selected verbatim, with no code normalization. Every
  other part of the app (SoctyChargs_Tbl.Category, BillRenderer's
  ExpandSizePlot) expects the code "10M", not the string "10 Marla" - so
  selecting the third option in the original WinForms app would silently
  break that consumer's society-charges lookup on their next bill. The
  frontend for this page uses "10M" as the option value instead of
  "10 Marla" to avoid propagating that bug; flagging it here explicitly
  rather than deciding unilaterally that this fix is correct.
"""

from datetime import date, datetime

from flask import Blueprint, jsonify, request, session

from sqlalchemy.exc import IntegrityError

from auth_utils import admin_required, login_required
from database import SessionLocal
from models import ConsumerTbl, MeterDetailTbl

consumers_bp = Blueprint("consumers", __name__)

RESIDENTIAL_CODE_TO_DISPLAY = {"R": "Residential", "C": "Commercial", "SC": "Semi Commercial"}
RESIDENTIAL_DISPLAY_TO_CODE = {v: k for k, v in RESIDENTIAL_CODE_TO_DISPLAY.items()}
VALID_RESIDENTIAL_CODES = set(RESIDENTIAL_CODE_TO_DISPLAY.keys())


import re

_ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def _parse_strict_date(value):
    """Rejects malformed years (e.g. 5-digit or 3-digit) before they ever
    reach date.fromisoformat, instead of trusting the browser's date picker."""
    if not value or not _ISO_DATE_RE.match(value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None

# ══════════════════════════════════════════════════════════════
# POST /api/consumers
# Equivalent of CustomerForm.AddRecord() - creates the consumer AND its
# first meter row together, same two-insert flow as the C# form.
# body: { ReferenceNo, Bill_MF, Name, Address, ConnectionDate: "YYYY-MM-DD",
#         MeterNumber, Initial_reading, Phase, Residential ("R"|"C"|"SC"), SizePlot }
# NOTE: keys match WConsumer_Tbl / WMeterDetail_Tbl column names directly -
# the frontend sends Residential as the code already, not a display string,
# so no RESIDENTIAL_DISPLAY_TO_CODE lookup is needed here.
# ══════════════════════════════════════════════════════════════
@consumers_bp.route("", methods=["POST"])
@admin_required
def add_consumer():
    data = request.get_json(silent=True) or {}

    ref_no_raw = str(data.get("ReferenceNo", "")).strip()
    name = (data.get("Name") or "").strip()
    address = (data.get("Address") or "").strip()
    meter_no_raw = str(data.get("MeterNumber", "")).strip()
    reading_raw = str(data.get("Initial_reading", "")).strip()
    conn_date_raw = data.get("ConnectionDate", "")
    bill_mf_raw = data.get("Bill_MF", "1")
    phase = data.get("Phase", "")
    residential_code = data.get("Residential", "")
    size_plot = data.get("SizePlot", "")

    # if len(ref_no_raw) != 9 or not ref_no_raw.isdigit():
    #     return jsonify({"error": "Reference No. must be exactly 9 digits!"}), 400
    if not name:
        return jsonify({"error": "Name is required!"}), 400
    if name.isdigit():
        return jsonify({"error": "Name cannot be only numbers."}), 400
    # if len(name) > 30 or len(name) < 5:
    #     return jsonify({"error": "Name must be of length 5 or less than or equal to 30 characters!"}), 400
    if not address:
        return jsonify({"error": "Address is required!"}), 400
    if address.isdigit():
        return jsonify({"error": "Address cannot be only numbers."}), 400
    if len(address) > 100:
        return jsonify({"error": "Address must be less than or equal to 100 characters!"}), 400
    if len(meter_no_raw) != 7 or not meter_no_raw.isdigit():
        return jsonify({"error": "Meter Number must be exactly 7 digits!"}), 400
    if not reading_raw.isdigit() or len(reading_raw) > 6:
        return jsonify({"error": "Meter Reading must be <= 6 digits!"}), 400
    # if conn_date.year < 2000 or conn_date.year > 2099:
    #     return jsonify({"error": "Connection Date must be of 4 digits only."}), 400
    # # try:
    #     conn_date = date.fromisoformat(conn_date_raw)
    # except (ValueError, TypeError):
    #     return jsonify({"error": "Invalid connection date."}), 400

    conn_date = _parse_strict_date(conn_date_raw)
    if conn_date is None:
        return jsonify({"error": "Date must be a valid date with a 4-digit year."}), 400
    if conn_date > date.today():
        return jsonify({"error": "Connection Date cannot be in the future."}), 400
    try:
        bill_mf = float(bill_mf_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Bill MF must be a valid number."}), 400
    if residential_code not in VALID_RESIDENTIAL_CODES:
        return jsonify({"error": "Invalid residential type."}), 400

    ref_no = int(ref_no_raw)
    meter_no = int(meter_no_raw)

    db = SessionLocal()
    try:
        if db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first():
            return jsonify({"error": "This Reference Number already exists."}), 409
        if db.query(MeterDetailTbl).filter_by(MeterNumber=meter_no).first():
            return jsonify({"error": "This Meter Number already exists. Each meter must be unique."}), 409

        now = datetime.now()
        db.add(ConsumerTbl(
            ReferenceNo=ref_no, Bill_MF=bill_mf, Name=name, Address=address,
            ConnectionDate=conn_date, State="N",
            UserID=session["user_id"], Date=now.date(), Time=now.time(),
        ))
        db.add(MeterDetailTbl(
            MeterNumber=meter_no, Status="A", Phase=phase, Residential=residential_code,
            SizePlot=size_plot, ReferenceNo=ref_no, Initial_Reading=int(reading_raw),
            UserID=session["user_id"], Date=now.date(), Time=now.time(),
        ))
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            msg = str(e.orig)
            if "chk_userlen_consumer" in msg:
                return jsonify({"error": "Name must be between 5 and 30 characters."}), 400
             
        return jsonify({"message": "Record Successfully Added!"}), 201
    finally:
        db.close()


def _format_size_plot(code):
    if not code:
        return code
    code = code.strip()
    if code.upper().endswith("K"):
        return code[:-1] + " Kanal"
    if code.upper().endswith("M"):
        return code[:-1] + " Marla"
    return code + " Kanal"


def _consumer_dict(c):
    return {
        "referenceNo": c.ReferenceNo,
        "billMf": float(c.Bill_MF) if c.Bill_MF is not None else None,
        "name": c.Name,
        "address": c.Address,
        "connectionDate": c.ConnectionDate.isoformat() if c.ConnectionDate else None,
        "state": c.State,
    }


def _meter_dict(m, formatted=False):
    return {
        
        "meterNumber": m.MeterNumber,
        "status": "Active" if m.Status == "A" else "Inactive",
        "statusCode": m.Status,
        "phase": m.Phase,
        "residential": m.Residential,
        "residentialDisplay": RESIDENTIAL_CODE_TO_DISPLAY.get(m.Residential, "Residential"),
        "sizePlot": m.SizePlot,
        "sizePlotDisplay": _format_size_plot(m.SizePlot) if formatted else m.SizePlot,
    }


# ══════════════════════════════════════════════════════════════
# GET /api/consumers/<ref>/display
# Equivalent of DisplayForm.SearchRecord() - active meters only,
# soft-deletes the consumer if none are active (see module docstring).
# ══════════════════════════════════════════════════════════════
@consumers_bp.route("/<int:ref_no>/display", methods=["GET"])
@login_required
def display_consumer(ref_no):
    db = SessionLocal()
    try:
        consumer = db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first()
        if consumer is None:
            return jsonify({"error": f"No record found for Reference No: {ref_no}"}), 404

        active_meters = (
            db.query(MeterDetailTbl)
            .filter(MeterDetailTbl.ReferenceNo == ref_no, MeterDetailTbl.Status != "I")
            .all()
        )

        if not active_meters:
            consumer.State = "D"
            db.commit()

        return jsonify({
            "consumer": _consumer_dict(consumer),
            "meters": [_meter_dict(m, formatted=True) for m in active_meters],
        }), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# GET /api/consumers/<ref>
# Equivalent of UpdateForm.SearchRecord() - ALL meters, no side effects.
# ══════════════════════════════════════════════════════════════
@consumers_bp.route("/<int:ref_no>", methods=["GET"])
@login_required
def get_consumer(ref_no):
    db = SessionLocal()
    try:
        consumer = db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first()
        if consumer is None:
            return jsonify({"error": f"No record found for Reference No: {ref_no}"}), 404

        meters = db.query(MeterDetailTbl).filter_by(ReferenceNo=ref_no).all()
        return jsonify({
            "consumer": _consumer_dict(consumer),
            "meters": [_meter_dict(m) for m in meters],
        }), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# PUT /api/consumers/<ref>
# Equivalent of UpdateForm.UpdateRecord() - core consumer fields only.
# body: { billMf, name, address, connectionDate: "YYYY-MM-DD" }
# ══════════════════════════════════════════════════════════════
@consumers_bp.route("/<int:ref_no>", methods=["PUT"])
@admin_required
def update_consumer(ref_no):
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    address = (data.get("address") or "").strip()
    conn_date_raw = data.get("connectionDate", "")
    bill_mf_raw = data.get("billMf")

    # if len(name) > 30 or len(name) < 5:
    #     return jsonify({"error": "Name should be minimum 5 characters or 30 characters or less!"}), 400
    if name.isdigit():
        return jsonify({"error": "Name cannot be only numbers."}), 400
    if not address:
        return jsonify({"error": "Address is required!"}), 400
    if address.isdigit():
        return jsonify({"error": "Address cannot be only numbers."}), 400
    try:
        conn_date = date.fromisoformat(conn_date_raw)
    except (ValueError, TypeError):
        return jsonify({"error": "Connection Date is invalid."}), 400
    if conn_date > date.today():
        return jsonify({"error": "Connection Date cannot be in the future."}), 400
    try:
        bill_mf = float(bill_mf_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Bill MF must be a valid number."}), 400

    db = SessionLocal()
    try:
        consumer = db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first()
        if consumer is None:
            return jsonify({"error": "Customer not found!"}), 404

        now = datetime.now()
        consumer.Bill_MF = bill_mf
        consumer.Name = name
        consumer.Address = address
        consumer.ConnectionDate = conn_date
        consumer.UserID = session["user_id"]
        consumer.Date = now.date()
        consumer.Time = now.time()
        if consumer.State == "D":
            consumer.State = " "

        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            msg = str(e.orig)
            if "chk_userlen_consumer" in msg:
                return jsonify({"error": "Name must be between 5 and 30 characters."}), 400
             
        return jsonify({"message": "Record Successfully Updated!"}), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# PUT /api/consumers/<ref>/meters/<meter_id>
# Equivalent of the meter card's btnSave.Click in BuildMeterCards().
# body: { meterNumber, status: "Active"|"Inactive", phase, residentialDisplay, sizePlot }
# ══════════════════════════════════════════════════════════════
@consumers_bp.route("/<int:ref_no>/meters", methods=["POST"])
@admin_required
def add_meter(ref_no):
    data = request.get_json(silent=True) or {}
    meter_no_raw = (data.get("meterNumber") or "").strip()
    reading_raw = str(data.get("initialReading", "")).strip()
    phase = data.get("phase", "")
    residential_display = data.get("residentialDisplay", "Residential")
    size_plot = data.get("sizePlot", "")
    status_label = data.get("status", "Inactive")

    if len(meter_no_raw) != 7 or not meter_no_raw.isdigit():
        return jsonify({"error": "Meter number must be exactly 7 digits."}), 400
    if not reading_raw.isdigit() or len(reading_raw) > 6:
        return jsonify({"error": "Meter Reading must be <= 6 digits!"}), 400

    meter_no = int(meter_no_raw)
    residential_code = RESIDENTIAL_DISPLAY_TO_CODE.get(residential_display, "R")
    status_code = "A" if status_label == "Active" else "I"

    db = SessionLocal()
    try:
        consumer = db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first()
        if consumer is None:
            return jsonify({"error": "Consumer not found."}), 404

        if db.query(MeterDetailTbl).filter_by(MeterNumber=meter_no).first():
            return jsonify({"error": "This Meter Number already exists. Each meter must be unique."}), 409

        now = datetime.now()

        if status_code == "A":
            others = (db.query(MeterDetailTbl)
                      .filter(MeterDetailTbl.ReferenceNo == ref_no, MeterDetailTbl.Status == "A")
                      .all())
            for m in others:
                m.Status = "I"
                m.UserID = session["user_id"]
                m.Date = now.date()
                m.Time = now.time()

        db.add(MeterDetailTbl(
            MeterNumber=meter_no, Phase=phase, Residential=residential_code,
            SizePlot=size_plot, Status=status_code, ReferenceNo=ref_no,
            Initial_Reading=int(reading_raw),
            UserID=session["user_id"], Date=now.date(), Time=now.time(),
        ))
        db.commit()

        if status_code == "A" and consumer.State == "D":
            consumer.State = " "
            consumer.UserID = session["user_id"]
            consumer.Date = now.date()
            consumer.Time = now.time()
            db.commit()

        meters = db.query(MeterDetailTbl).filter_by(ReferenceNo=ref_no).all()
        return jsonify({"message": "Meter added successfully!", "meters": [_meter_dict(m) for m in meters]}), 201
    finally:
        db.close()



@consumers_bp.route("/<int:ref_no>/meters/<int:meter_id>", methods=["PUT"])
@admin_required
def update_meter(ref_no, meter_id):
    data = request.get_json(silent=True) or {}
    new_meter_no_raw = (data.get("meterNumber") or "").strip()
    status_label = data.get("status", "Inactive")
    phase = data.get("phase", "")
    residential_display = data.get("residentialDisplay", "Residential")
    size_plot = data.get("sizePlot", "")

    if len(new_meter_no_raw) != 7 or not new_meter_no_raw.isdigit():
        return jsonify({"error": "Meter number must be exactly 7 digits."}), 400
    new_meter_no = int(new_meter_no_raw)
    residential_code = RESIDENTIAL_DISPLAY_TO_CODE.get(residential_display, "R")

    db = SessionLocal()
    try:
        meter = db.query(MeterDetailTbl).filter_by(MeterNumber=meter_id).first()
        if meter is None:
            return jsonify({"error": "Meter not found."}), 404

        now = datetime.now()
        meter_no_changed = new_meter_no != meter.MeterNumber

        if meter_no_changed:
            meter.Status = "I"
            meter.UserID = session["user_id"]
            meter.Date = now.date()
            meter.Time = now.time()

            others = (db.query(MeterDetailTbl)
                      .filter(MeterDetailTbl.ReferenceNo == ref_no, MeterDetailTbl.Status == "A",
                              MeterDetailTbl.MeterNumber != meter_id).all())
            for m in others:
                m.Status = "I"
                m.UserID = session["user_id"]
                m.Date = now.date()
                m.Time = now.time()

            db.add(MeterDetailTbl(
                MeterNumber=new_meter_no, Phase=phase, Residential=residential_code,
                SizePlot=size_plot, Status="A", ReferenceNo=ref_no, Initial_Reading=0,
                UserID=session["user_id"], Date=now.date(), Time=now.time(),
            ))
        else:
            new_status = "A" if status_label == "Active" else "I"
            if new_status == "A" and meter.Status != "A":
                others = (db.query(MeterDetailTbl)
                          .filter(MeterDetailTbl.ReferenceNo == ref_no, MeterDetailTbl.Status == "A",
                                  MeterDetailTbl.MeterNumber != meter_id).all())
                for m in others:
                    m.Status = "I"
                    m.UserID = session["user_id"]
                    m.Date = now.date()
                    m.Time = now.time()

            meter.Phase = phase
            meter.Residential = residential_code
            meter.SizePlot = size_plot
            meter.Status = new_status
            meter.UserID = session["user_id"]
            meter.Date = now.date()
            meter.Time = now.time()

        db.commit()

        any_active = (db.query(MeterDetailTbl)
                      .filter(MeterDetailTbl.ReferenceNo == ref_no, MeterDetailTbl.Status == "A")
                      .first() is not None)
        consumer = db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first()
        if consumer is not None:
            if not any_active and consumer.State != "D":
                consumer.State = "D"
                consumer.UserID = session["user_id"]
                consumer.Date = now.date()
                consumer.Time = now.time()
            elif any_active and consumer.State == "D":
                consumer.State = " "
                consumer.UserID = session["user_id"]
                consumer.Date = now.date()
                consumer.Time = now.time()
            db.commit()

        meters = db.query(MeterDetailTbl).filter_by(ReferenceNo=ref_no).all()
        return jsonify({"message": "Meter updated successfully!", "meters": [_meter_dict(m) for m in meters]}), 200
    finally:
        db.close()
   