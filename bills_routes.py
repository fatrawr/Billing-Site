"""
Bill generation blueprint — web equivalent of BillForm.cs's BuildPayload().
Register with: app.register_blueprint(bills_bp, url_prefix="/api/bills")

Payment and Reading logic (seeding, posting, entry screens) now live in
their own blueprints - see payment_routes.py and reading_routes.py.
"""

from datetime import date

from flask import Blueprint, jsonify, request

from auth_utils import admin_required, login_required
from database import SessionLocal
from models import (
    BankInfoTbl, ConfigTbl, ConsumerTbl, DatesTbl, MasterTbl,
    MeterDetailTbl, SoctyChargsTbl, StaffPhoneTbl,
)

bills_bp = Blueprint("bills", __name__)


def format_month(yyyymm):
    yr, mo = yyyymm // 100, yyyymm % 100
    return date(yr, mo, 1).strftime("%b-%Y")


def expand_residential(r):
    return {"R": "Residential", "SC": "Semi Commercial", "C": "Commercial"}.get((r or "").upper(), r or "")


def expand_size_plot(s):
    return {"2K": "2 Kanals", "1K": "1 Kanal", "10M": "10 Marla"}.get((s or "").upper(), s or "")


def expand_phase(p):
    return {"1": "1 Phase", "3": "3 Phase"}.get(p, p or "")


_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
         "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
         "Seventeen", "Eighteen", "Nineteen"]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


def number_to_words(n):
    n = int(n)
    if n == 0:
        return "Zero"
    if n < 0:
        return "Minus " + number_to_words(-n)
    if n < 20:
        return _ONES[n]
    if n < 100:
        return _TENS[n // 10] + (f" {_ONES[n % 10]}" if n % 10 else "")
    if n < 1000:
        return _ONES[n // 100] + " Hundred" + (f" {number_to_words(n % 100)}" if n % 100 else "")
    if n < 100000:
        return number_to_words(n // 1000) + " Thousand" + (f" {number_to_words(n % 1000)}" if n % 1000 else "")
    if n < 10000000:
        return number_to_words(n // 100000) + " Lakh" + (f" {number_to_words(n % 100000)}" if n % 100000 else "")
    return number_to_words(n // 10000000) + " Crore" + (f" {number_to_words(n % 10000000)}" if n % 10000000 else "")


def _num(value, default=0):
    return float(value) if value is not None else default


def _build_payload(db, ref_no, month, silent=False):
    if not db.query(MasterTbl).filter_by(Yyyymm=month).first():
        return None, f"No billing data found for {format_month(month)}."

    dates = db.query(DatesTbl).filter_by(Month=month).first()

    consumer = db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first()
    if consumer is None:
        return None, f"Consumer {ref_no} not found."

    meter = db.query(MeterDetailTbl).filter_by(ReferenceNo=ref_no).first()
    if meter is None:
        return None, f"No active meter found for {ref_no}."

    master_row = db.query(MasterTbl).filter_by(ReferenceNo=ref_no, Yyyymm=month).first()
    if master_row is None:
        return None, None

    if consumer.State == "D" and _num(master_row.Tot_Bill_Amnt) <= 0:
        return None, f"Consumer {ref_no} is disconnected with no outstanding balance."

    socty_rows = (
        db.query(SoctyChargsTbl)
        .filter(SoctyChargsTbl.State != "D", SoctyChargsTbl.Category == (meter.SizePlot or ""))
        .all()
    )

    om_config = db.query(ConfigTbl).filter_by(ConfigCode="OM").first()
    om_rate = _num(om_config.ConfigValue, 1.0) if om_config else 1.0

    banks = db.query(BankInfoTbl).filter(BankInfoTbl.State != "D").all()
    staff_phones = db.query(StaffPhoneTbl).filter(StaffPhoneTbl.State != "D").all()

    history = (
        db.query(MasterTbl)
        .filter(MasterTbl.ReferenceNo == ref_no, MasterTbl.Yyyymm < month)
        .order_by(MasterTbl.Yyyymm.desc())
        .limit(12)
        .all()
    )
    history = list(reversed(history))

    units = master_row.Units or 0

    payload = {
        "consumer": {
            "referenceNo": consumer.ReferenceNo,
            "name": consumer.Name,
            "address": consumer.Address,
            "connectionDate": consumer.ConnectionDate.isoformat() if consumer.ConnectionDate else None,
            "state": consumer.State,
        },
        "meter": {
            "meterNumber": meter.MeterNumber,
            "residential": expand_residential(meter.Residential),
            "sizePlot": expand_size_plot(meter.SizePlot),
            "sizePlotCode": meter.SizePlot,
            "phase": expand_phase(meter.Phase),
        },
        "master": {
            "units": units,
            "prevRdg": master_row.Prev_Rdg,
            "currRdg": master_row.Curr_Rdg,
            "unitRate": _num(master_row.Unit_Rate),
            "elctyAmnt": _num(master_row.Elcty_Amnt),
            "soctyChgs": _num(master_row.Socty_Chgs),
            "arrears": _num(master_row.Arrears),
            "omChgs": _num(master_row.Om_Chgs),
            "totBillAmnt": _num(master_row.Tot_Bill_Amnt),
            "lpSrchg": _num(master_row.Lp_Srchg),
            "billAmntAfterDueDt": _num(master_row.Bill_Amnt_Aftr_Due_Dt),
        },
        "dates": {
            "rdgDate": dates.rdg_dt.isoformat() if dates else None,
            "issDate": dates.iss_dt.isoformat() if dates else None,
            "dueDate": dates.due_dt.isoformat() if dates else None,
        } if dates else None,
        "soctyRows": [
            {"description": s.Description, "amount": 0 if (units == 0 and consumer.State == "D") else _num(s.Amount)}
            for s in socty_rows
        ],
        "banks": [{"bankName": b.BankName, "accountNo": b.AccountNo} for b in banks],
        "staffPhones": [{"staffName": p.StaffName, "phoneNumber": p.PhoneNumber} for p in staff_phones],
        "history": [
            {
                "monthDisplay": format_month(h.Yyyymm),
                "units": h.Units,
                "totBillAmnt": _num(h.Tot_Bill_Amnt),
                "paymentDate": h.PaymentDate.isoformat() if h.PaymentDate else None,
                "paymentAmnt": None if h.Paid_Unpaid == "N" else _num(h.Payment_Made),
            }
            for h in history
        ],
        "billMonth": month,
        "billMonthDisplay": format_month(month),
        "omRate": om_rate,
        "amountInWords": number_to_words(_num(master_row.Tot_Bill_Amnt)) + " only",
    }
    return payload, None


@bills_bp.route("/preview", methods=["GET"])
@admin_required
def preview_bills():
    month_str = request.args.get("month", "")
    from_ref = request.args.get("from", "")
    to_ref = request.args.get("to", "")

    try:
        yyyy_str, mm_str = month_str.split("-")
        mm, yyyy = int(mm_str), int(yyyy_str)
        if mm < 1 or mm > 12 or yyyy < 2000:
            raise ValueError
    except (ValueError, AttributeError):
        return jsonify({"error": "Invalid month format. Use MM/YYYY (e.g. 05/2026)."}), 400
    month = yyyy * 100 + mm

    if not from_ref.strip().isdigit():
        return jsonify({"error": "From Reference Number must be numeric."}), 400
    from_ref = int(from_ref)

    db = SessionLocal()
    try:
        if from_ref == 0:
            if not db.query(MasterTbl).filter_by(Yyyymm=month).first():
                return jsonify({"error": f"No billing data found for {format_month(month)}."}), 404

            all_refs = [r.ReferenceNo for r in db.query(ConsumerTbl).order_by(ConsumerTbl.ReferenceNo).all()]
            bills = []
            for ref in all_refs:
                payload, _ = _build_payload(db, ref, month, silent=True)
                if payload is not None:
                    bills.append(payload)

            if not bills:
                return jsonify({"error": "No consumers have billing data for this month."}), 400

            return jsonify({"bills": bills}), 200
        
        if not to_ref.strip():
            payload, error = _build_payload(db, from_ref, month)
            if payload is None:
                return jsonify({"error": error or "Could not build this bill."}), 400
            return jsonify({"bills": [payload]}), 200

        if not to_ref.strip().isdigit():
            return jsonify({"error": "To Reference Number must be numeric."}), 400
        to_ref = int(to_ref)

        if not str(from_ref).startswith("1213"):
            return jsonify({"error": "From Reference Number must start with 1213."}), 400
        if to_ref < from_ref:
            return jsonify({"error": "To Reference Number must be greater than or equal to From."}), 400

        refs_in_range = [
            r.ReferenceNo for r in
            db.query(ConsumerTbl)
            .filter(ConsumerTbl.ReferenceNo >= from_ref, ConsumerTbl.ReferenceNo <= to_ref)
            .order_by(ConsumerTbl.ReferenceNo)
            .all()
        ]
        if not refs_in_range:
            return jsonify({"error": f"No consumers found between {from_ref} and {to_ref}."}), 404

        if not db.query(MasterTbl).filter_by(Yyyymm=month).first():
            return jsonify({"error": f"No billing data found for {format_month(month)}."}), 404

        bills = []
        for ref in refs_in_range:
            payload, _ = _build_payload(db, ref, month, silent=True)
            if payload is not None:
                bills.append(payload)

        if not bills:
            return jsonify({"error": "No valid bills could be generated for the given range and month."}), 400

        return jsonify({"bills": bills}), 200
    finally:
        db.close()