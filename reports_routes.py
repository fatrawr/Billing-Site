"""
Reports blueprint — "List of Consumers" report (Reports > List of Consumers
in the admin menu). Pulls each consumer's core record plus their meter
details in one pass, for a printable listing.

Register with: app.register_blueprint(reports_bp, url_prefix="/api/reports")
"""

from collections import defaultdict
from sqlalchemy import func
from flask import Blueprint, jsonify, request
from datetime import date
from database import SessionLocal
from models import ConsumerTbl, MeterDetailTbl, MasterTbl
from bills_routes import expand_residential, expand_size_plot, expand_phase

reports_bp = Blueprint("reports", __name__)

def _month_display(yyyymm):
    yr, mo = yyyymm // 100, yyyymm % 100
    return date(yr, mo, 1).strftime("%B %Y")  # e.g. "March 2026"

def expand_state(s):
    return {"D": "Disconnected", "N": "New"}.get((s or "").upper(), "Active")


def expand_meter_status(s):
    return {"A": "Active", "I": "Inactive"}.get((s or "").upper(), s or "")


@reports_bp.route("/consumers", methods=["GET"])
def consumers_report():
    from_ref = request.args.get("from", "").strip()
    to_ref = request.args.get("to", "").strip()

    db = SessionLocal()
    try:
        if not from_ref:
              consumers = db.query(ConsumerTbl).order_by(ConsumerTbl.ReferenceNo).all()
        else:
            if not from_ref.isdigit():
                return jsonify({"error": "Reference Number must be numeric."}), 400
            from_ref_int = int(from_ref)   
            if to_ref:
                if not to_ref.isdigit():
                    return jsonify({"error": "Range Reference Number must be numeric."}), 400
                to_ref_int = int(to_ref)
                if to_ref_int < from_ref_int:
                    return jsonify({"error": "Range end must be greater than or equal to the starting Reference Number."}), 400

                consumers = (
                    db.query(ConsumerTbl)
                    .filter(ConsumerTbl.ReferenceNo >= from_ref_int, ConsumerTbl.ReferenceNo <= to_ref_int)
                    .order_by(ConsumerTbl.ReferenceNo)
                    .all()
                )
            else:
                consumers = (
                    db.query(ConsumerTbl)
                    .filter(ConsumerTbl.ReferenceNo == from_ref_int)
                    .all()
                )

        if not consumers:
            return jsonify({"error": "No consumers found for the given Reference Number(s)."}), 404

        ref_nos = [c.ReferenceNo for c in consumers]

        # Was a plain dict keyed by ReferenceNo, so a consumer with more
        # than one meter silently kept only the last one queried. Grouped
        # into a list per ReferenceNo instead, so every meter comes through.
        meters_by_ref = defaultdict(list)
        for m in db.query(MeterDetailTbl).filter(MeterDetailTbl.ReferenceNo.in_(ref_nos)).all():
            meters_by_ref[m.ReferenceNo].append(m)

        rows = []
        for c in consumers:
            meters = meters_by_ref.get(c.ReferenceNo, [])
            rows.append({
                "referenceNo": c.ReferenceNo,
                "name": c.Name,
                "address": c.Address,
                "connectionDate": c.ConnectionDate.isoformat() if c.ConnectionDate else None,
                "state": expand_state(c.State),
                "multiplyingFactor": float(c.Bill_MF) if c.Bill_MF is not None else None,
                "meters": [
                    {
                        "meterNumber": m.MeterNumber,
                        "status": expand_meter_status(m.Status),
                        "phase": expand_phase(m.Phase),
                        "typeOfProperty": expand_residential(m.Residential),
                        "plotSize": expand_size_plot(m.SizePlot),
                    }
                    for m in meters
                ],
            })

        return jsonify({"consumers": rows}), 200
    finally:
        db.close()










@reports_bp.route("/yearly-payments", methods=["GET"])
def yearly_payments_report():
    """
    Month-wise summary of billed vs paid amounts across a range of months,
    aggregated over every consumer for each month (Reports > Yearly Payments
    Report). `to` is optional — if omitted, the range runs from `from`
    through whichever month is the latest one actually billed in that same
    year (not necessarily December, since a year may not be fully billed
    out yet).
    """
    from_str = request.args.get("from", "").strip()
    to_str = request.args.get("to", "").strip()

    def parse_month(s, label):
        try:
            yyyy_str, mm_str = s.split("-")
            yyyy, mm = int(yyyy_str), int(mm_str)
            if mm < 1 or mm > 12 or yyyy < 2000:
                raise ValueError
        except (ValueError, AttributeError):
            return None, jsonify({"error": f"Invalid {label} month format. Use MM/YYYY."}), 400
        return yyyy * 100 + mm, None, None

    if not from_str:
        return jsonify({"error": "Please provide a starting month."}), 400
    from_month, err, code = parse_month(from_str, "starting")
    if err:
        return err, code

    db = SessionLocal()
    try:
        if to_str:
            to_month, err, code = parse_month(to_str, "ending")
            if err:
                return err, code
            if to_month < from_month:
                return jsonify({"error": "Ending month must be on or after the starting month."}), 400
        else:
            # No end given: run through the latest billed month in the
            # same calendar year as `from`.
            year = from_month // 100
            year_start, year_end = year * 100 + 1, year * 100 + 12
            latest = (
                db.query(func.max(MasterTbl.Yyyymm))
                .filter(MasterTbl.Yyyymm >= year_start, MasterTbl.Yyyymm <= year_end)
                .scalar()
            )
            if latest is None or latest < from_month:
                return jsonify({"error": f"No billing data found for {year}."}), 404
            to_month = latest

        totals = (
            db.query(
                MasterTbl.Yyyymm,
                func.sum(MasterTbl.Tot_Bill_Amnt).label("due"),
                func.sum(MasterTbl.Payment_Made).label("made"),
            )
            .filter(MasterTbl.Yyyymm >= from_month, MasterTbl.Yyyymm <= to_month)
            .group_by(MasterTbl.Yyyymm)
            .order_by(MasterTbl.Yyyymm)
            .all()
        )

        if not totals:
            return jsonify({"error": "No billing data found for the given range."}), 404

        rows = []
        for yyyymm, due, made in totals:
            due_raw = float(due or 0)
            made_raw = float(made or 0)
            due_m = round(due_raw / 1_000_000, 2)
            made_m = round(made_raw / 1_000_000, 2)
            diff_m = (due_raw - made_raw)  # from raw rupees, not the rounded millions above
            rows.append({
                "month": yyyymm,
                "monthDisplay": _month_display(yyyymm),
                "due": due_m,
                "made": made_m,
                "diff": diff_m,
            })

        range_display = (
            _month_display(from_month) if from_month == to_month
            else f"{_month_display(from_month)} to {_month_display(to_month)}"
        )

        return jsonify({
            "from": from_month,
            "to": to_month,
            "rangeDisplay": range_display,
            "rows": rows,
        }), 200
    finally:
        db.close()