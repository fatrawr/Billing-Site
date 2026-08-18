"""
Reports blueprint — "List of Consumers" report (Reports > List of Consumers
in the admin menu). Pulls each consumer's core record plus their meter
details in one pass, for a printable listing.

Register with: app.register_blueprint(reports_bp, url_prefix="/api/reports")
"""

from flask import Blueprint, jsonify, request

from database import SessionLocal
from models import ConsumerTbl, MeterDetailTbl
from bills_routes import expand_residential, expand_size_plot, expand_phase

reports_bp = Blueprint("reports", __name__)


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
        meters_by_ref = {
            m.ReferenceNo: m
            for m in db.query(MeterDetailTbl).filter(MeterDetailTbl.ReferenceNo.in_(ref_nos)).all()
        }

        rows = []
        for c in consumers:
            meter = meters_by_ref.get(c.ReferenceNo)
            rows.append({
                "referenceNo": c.ReferenceNo,
                "name": c.Name,
                "address": c.Address,
                "connectionDate": c.ConnectionDate.isoformat() if c.ConnectionDate else None,
                "state": expand_state(c.State),
                "multiplyingFactor": float(c.Bill_MF) if c.Bill_MF is not None else None,
                "meter": {
                    "meterNumber": meter.MeterNumber,
                    "status": expand_meter_status(meter.Status),
                    "phase": expand_phase(meter.Phase),
                    "typeOfProperty": expand_residential(meter.Residential),
                    "plotSize": expand_size_plot(meter.SizePlot),
                } if meter else None,
            })

        return jsonify({"consumers": rows}), 200
    finally:
        db.close()
