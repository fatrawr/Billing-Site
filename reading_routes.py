"""
Reading blueprint — web equivalent of ReadingPosting.cs / RSeeder.cs / ReadingForm.cs.
Register with: app.register_blueprint(reading_bp, url_prefix="/api/readings")
"""

import random
from datetime import datetime

from flask import Blueprint, jsonify, request, session

from auth_utils import login_required
from database import SessionLocal
from models import ConfigTbl, ConsumerTbl, MasterTbl, MeterDetailTbl, ReadingTbl, SoctyChargsTbl

reading_bp = Blueprint("reading", __name__)


def _get_reading_target_yyymm(db):
    """Port of ReadingMonthHelper.GetTargetYYMM - next month AFTER the latest
    Master_Tbl month (different from payment_routes.py's version, which
    returns the latest month itself, not +1 - two distinct C# helpers)."""
    latest = db.query(MasterTbl.Yyyymm).order_by(MasterTbl.Yyyymm.desc()).first()
    if latest is None:
        return None
    yy, mm = latest[0] // 100, latest[0] % 100 + 1
    if mm > 12:
        mm, yy = 1, yy + 1
    return yy * 100 + mm

def _resolve_reading_month(db):
    """Prefer the next unposted month (normal entry flow). If that month has
    no Reading_Tbl rows yet (e.g. right after posting, before reset/seed has
    run for the new month), fall back to the latest month that actually HAS
    reading data, instead of erroring out."""
    target = _get_reading_target_yyymm(db)
    if target is not None:
        has_rows = db.query(ReadingTbl).filter_by(YYMM=target).first() is not None
        if has_rows:
            return target

    fallback = db.query(ReadingTbl.YYMM).order_by(ReadingTbl.YYMM.desc()).first()
    return fallback[0] if fallback else None


def _generate_curr_rdg(prev_rdg):
    """Port of ReadingGenerator.GenerateCurrRdg."""
    first3, last3 = prev_rdg // 1000, prev_rdg % 1000
    if last3 >= 990:
        first3 += 1
        curr = first3 * 1000 + random.randint(1, 99)
    else:
        min_last3, max_last3 = last3 + 10, min(last3 + 200, 999)
        curr = first3 * 1000 + 999 if min_last3 >= max_last3 else first3 * 1000 + random.randint(min_last3, max_last3)
    return curr, curr - prev_rdg


# ══════════════════════════════════════════════════════════════
# POST /api/readings/reset — port of ReadingResetHelper + ReadingSeederLogic.Seed
# ══════════════════════════════════════════════════════════════
@reading_bp.route("/reset", methods=["POST"])
@login_required
def reset_readings():
    """Confirmation dialog lives on the frontend (window.confirm) before this
    is ever called - same as the C# MessageBox.Show Yes/No gate."""
    db = SessionLocal()
    try:
        deleted = db.query(ReadingTbl).delete()
        db.commit()

        target_yyymm = _get_reading_target_yyymm(db)
        if target_yyymm is None:  
            #return jsonify({"error": "Master_Tbl is empty."}), 400
            now = datetime.now()
            yy, mm = now.year, now.month - 1
            if mm == 0:
                mm, yy = 12, yy - 1
            target_yyymm = yy * 100 + mm

        inserted, skipped = 0, 0
        for c in db.query(ConsumerTbl).all():
            if db.query(ReadingTbl).filter_by(ReferenceNo=c.ReferenceNo, YYMM=target_yyymm).first():
                skipped += 1
                continue
            latest_master = (db.query(MasterTbl).filter_by(ReferenceNo=c.ReferenceNo)
                              .order_by(MasterTbl.Yyyymm.desc()).first())
            prev_rdg = latest_master.Curr_Rdg if latest_master else 0

            if c.State == "D":
                if latest_master is None:
                    skipped += 1
                    continue
                fully_paid = (latest_master.Payment_Made == latest_master.Tot_Bill_Amnt
                              or latest_master.Payment_Made == latest_master.Bill_Amnt_Aftr_Due_Dt)
                if fully_paid:
                    skipped += 1
                    continue
                db.add(ReadingTbl(ReferenceNo=c.ReferenceNo, YYMM=target_yyymm,
                                   PrevRdg=prev_rdg, CurrRdg=prev_rdg, Units=0))
                inserted += 1
                continue

            if c.State == "N":
                meter = db.query(MeterDetailTbl).filter_by(ReferenceNo=c.ReferenceNo, Status="A").first()
                prev_rdg = meter.Initial_Reading if meter else 0
                c.State=' '

            curr_rdg, units = _generate_curr_rdg(prev_rdg)
            db.add(ReadingTbl(ReferenceNo=c.ReferenceNo, YYMM=target_yyymm,
                               PrevRdg=prev_rdg, CurrRdg=curr_rdg, Units=units))
            inserted += 1

        db.commit()
        return jsonify({
            "message": f"Deleted {deleted} old rows. Regenerated {inserted} rows for {target_yyymm} ({skipped} skipped).",
            "deleted": deleted, "inserted": inserted, "skipped": skipped, "targetMonth": target_yyymm,
        }), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/readings/post — port of ReadingPostingHelper.PostReadings
# ══════════════════════════════════════════════════════════════
@reading_bp.route("/post", methods=["POST"])
@login_required
def post_readings():
    """NOTE: the C# GetConfigValue filters Config_Tbl by an EXACT month match
    (c.Month == month), despite its own docstring saying '<=, most recent
    wins' - ported here matching the actual code (exact match), not the
    docstring. Flagging the mismatch rather than silently picking one."""
    db = SessionLocal()
    try:
        readings = (db.query(ReadingTbl).filter(ReadingTbl.CurrRdg.isnot(None))
                    .order_by(ReadingTbl.YYMM, ReadingTbl.ReferenceNo).all())
        if not readings:
            return jsonify({"message": "No readings to post."}), 200

        consumers = {c.ReferenceNo: c for c in db.query(ConsumerTbl).all()}
        meters = {}
        for m in db.query(MeterDetailTbl).filter(MeterDetailTbl.Status == "A").all():
            meters[m.ReferenceNo] = m
        socty_rows = db.query(SoctyChargsTbl).filter(SoctyChargsTbl.State != "D").all()
        configs = db.query(ConfigTbl).all()

        def config_value(code, month):
            match = next((c for c in configs if c.ConfigCode == code and c.Month == month), None)
            if match is None:
                raise ValueError(f"No '{code}' config value found for month {month}.")
            return float(match.ConfigValue)

        def round10(v):
            return round(v / 10) * 10

        def prev_yyymm(yymm):
            yy, mm = yymm // 100, yymm % 100 - 1
            if mm == 0:
                mm, yy = 12, yy - 1
            return yy * 100 + mm

        def apply_arrears(master, prev_master):
            if prev_master is None:
                master.Arrears = 0
                return
            code = prev_master.Paid_Unpaid
            if code == "N":
                master.Arrears = prev_master.Bill_Amnt_Aftr_Due_Dt
            elif code in ("Y", "L"):
                master.Arrears = 0
            elif code == "P":
                master.Arrears = float(prev_master.Bill_Amnt_Aftr_Due_Dt) - float(prev_master.Payment_Made)
            elif code == "E":
                master.Arrears = float(prev_master.Tot_Bill_Amnt) - float(prev_master.Payment_Made)
            # else: leave Arrears untouched

        posted = 0
        for r in readings:
            consumer = consumers.get(r.ReferenceNo)
            meter = meters.get(r.ReferenceNo)
            if consumer is None or meter is None:
                continue

            rate_code = {"R": "UR", "C": "CM", "SC": "SC"}.get(meter.Residential, "UR")
            unit_rate = config_value(rate_code, r.YYMM)
            om_factor = config_value("OM", r.YYMM)
            lp_pct = config_value("LP", r.YYMM)
            socty_total = sum(int(s.Amount) for s in socty_rows if s.Category == meter.SizePlot)

            raw_units = r.Units if r.Units is not None else (r.CurrRdg or 0) - (r.PrevRdg or 0)
            units = int(raw_units * float(consumer.Bill_MF))
            elcty = round10(units * unit_rate)
            om = round(units * om_factor)

            master = db.query(MasterTbl).filter_by(ReferenceNo=r.ReferenceNo, Yyyymm=r.YYMM).first()
            if master is None:
                master = MasterTbl(ReferenceNo=r.ReferenceNo, Yyyymm=r.YYMM)
                db.add(master)

            prev_master = db.query(MasterTbl).filter_by(
                ReferenceNo=r.ReferenceNo, Yyyymm=prev_yyymm(r.YYMM)).first()
            apply_arrears(master, prev_master)
            arrears = float(master.Arrears) if master.Arrears is not None else 0

            now = datetime.now()
            master.MeterNumber = meter.MeterNumber
            master.Prev_Rdg = r.PrevRdg or 0
            master.Curr_Rdg = r.CurrRdg if r.CurrRdg is not None else master.Curr_Rdg
            master.Payment_Made = 0
            master.Paid_Unpaid = " "
            master.PaymentDate = None
            master.Rdg_Posting= session["user_id"]
            master.Rdg_P_Date = now.date()
            
            # master.Time = now.time()

            if consumer.State == "D":
                total = arrears
                lp = round10(total * lp_pct / 100)
                master.Units = 0
                master.Unit_Rate = 0
                master.Elcty_Amnt = 0
                master.Socty_Chgs = 0
                master.Om_Chgs = 0
            else:
                total = elcty + socty_total + om + arrears
                lp = round10(total * lp_pct / 100)
                master.Units = units
                master.Unit_Rate = round(unit_rate, 3)
                master.Elcty_Amnt = elcty
                master.Socty_Chgs = socty_total
                master.Om_Chgs = om

            master.Tot_Bill_Amnt = total
            master.Lp_Srchg = lp
            master.Bill_Amnt_Aftr_Due_Dt = total + lp
            posted += 1

        db.commit()
        return jsonify({"message": f"Posted {posted} reading(s) into Master_Tbl.", "posted": posted}), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# Reading Entry screen endpoints — web equivalent of ReadingForm.cs
# ══════════════════════════════════════════════════════════════
@reading_bp.route("/entry/init", methods=["GET"])
@login_required
def reading_entry_init():
    db = SessionLocal()
    try:
        target = _resolve_reading_month(db)
        if target is None:
            return jsonify({"error": "No reading data found. Please seed readings first."}), 404

        refs = [r[0] for r in db.query(ReadingTbl.ReferenceNo).filter_by(YYMM=target)
                .order_by(ReadingTbl.ReferenceNo).all()]
        last = (db.query(ReadingTbl)
                .filter(ReadingTbl.YYMM == target, ReadingTbl.CurrRdg.isnot(None))
                .order_by(ReadingTbl.ReferenceNo.desc()).first())
        if last is None:
            start_ref = refs[0]
        else:
            idx = refs.index(last.ReferenceNo) if last.ReferenceNo in refs else -1
            start_ref = refs[idx + 1] if 0 <= idx + 1 < len(refs) else refs[-1]
        return jsonify({"targetMonth": target, "refNumbers": refs, "startRef": start_ref}), 200
    finally:
        db.close()


@reading_bp.route("/entry/<int:ref_no>", methods=["GET"])
@login_required
def reading_entry_get(ref_no):
    db = SessionLocal()
    try:
        month_param = request.args.get("month")
        target = int(month_param) if month_param else _resolve_reading_month(db)
        if target is None:
            return jsonify({"error": "No reading data found."}), 404

        consumer = db.query(ConsumerTbl).filter_by(ReferenceNo=ref_no).first()
        reading = db.query(ReadingTbl).filter_by(ReferenceNo=ref_no, YYMM=target).first()
        if consumer is None or reading is None:
            return jsonify({"error": "Record not found."}), 404
        return jsonify({
            "referenceNo": ref_no,
            "address": consumer.Address,
            "connectionDate": consumer.ConnectionDate.isoformat() if consumer.ConnectionDate else None,
            "prevRdg": reading.PrevRdg or 0,
            "currRdg": reading.CurrRdg,
            "units": reading.Units,
        }), 200
    finally:
        db.close()


@reading_bp.route("/entry/<int:ref_no>", methods=["PUT"])
@login_required
def reading_entry_save(ref_no):
    data = request.get_json(silent=True) or {}
    try:
        curr = int(data.get("currRdg"))
        prev = int(data.get("prevRdg"))
    except (TypeError, ValueError):
        return jsonify({"error": "Enter a valid current reading."}), 400
    if len(str(data.get("currRdg", ""))) > 7:
        return jsonify({"error": "Current reading cannot exceed 7 digits."}), 400
    if curr < prev:
        return jsonify({"error": "Current reading cannot be less than previous reading."}), 400

    db = SessionLocal()
    try:
        target = data.get("month") or _resolve_reading_month(db)
        if target is None:
            return jsonify({"error": "No reading data found."}), 404

        existing = db.query(ReadingTbl).filter_by(ReferenceNo=ref_no, YYMM=target).first()
        if existing:
            existing.CurrRdg, existing.PrevRdg, existing.Units = curr, prev, curr - prev
        else:
            db.add(ReadingTbl(ReferenceNo=ref_no, YYMM=target, PrevRdg=prev, CurrRdg=curr, Units=curr - prev))
        db.commit()
        return jsonify({"message": "Saved."}), 200
    finally:
        db.close()