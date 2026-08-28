"""
Payment blueprint — web equivalent of PaymentPosting.cs / PSeeder.cs / PaymentForm.cs.
Register with: app.register_blueprint(payment_bp, url_prefix="/api/payments")
"""

from datetime import datetime

from flask import Blueprint, jsonify, request, session

from auth_utils import admin_required, login_required
from database import SessionLocal
from models import ConsumerTbl, DatesTbl, MasterTbl, PaymentTbl

payment_bp = Blueprint("payment", __name__)


def _get_target_yyyymm(db):
    """Port of ReadinglatestMonthHelper.GetTargetYYMM - the latest month
    that already has Master_Tbl rows (NOT +1 - see reading_routes.py's
    version, which is a different helper with different behavior)."""
    latest = db.query(MasterTbl.Yyyymm).order_by(MasterTbl.Yyyymm.desc()).first()
    return latest[0] if latest else None


# ══════════════════════════════════════════════════════════════
# POST /api/payments/reset — port of PaymentResetHelper + PaymentSeederLogic.Seed
# ══════════════════════════════════════════════════════════════
@payment_bp.route("/reset", methods=["POST"])
@admin_required
def reset_payments():
    """Confirmation dialog lives on the frontend (window.confirm) before this
    is ever called - same as the C# MessageBox.Show Yes/No gate."""
    db = SessionLocal()
    try:
        deleted = db.query(PaymentTbl).delete()
        db.commit()

        target_yyyymm = _get_target_yyyymm(db)
        if target_yyyymm is None:
            return jsonify({"error": "Master_Tbl is empty - nothing to base the payment table on."}), 400

        consumers = (db.query(ConsumerTbl).filter(ConsumerTbl.State != "N")
                     .order_by(ConsumerTbl.ReferenceNo).all())

        inserted, skipped = 0, 0
        for c in consumers:
            exists = db.query(PaymentTbl).filter_by(ReferenceNo=c.ReferenceNo, YYMM=target_yyyymm).first()
            if exists:
                skipped += 1
                continue

            latest_master = (db.query(MasterTbl).filter_by(ReferenceNo=c.ReferenceNo)
                              .order_by(MasterTbl.Yyyymm.desc()).first())
            payment_due = latest_master.Tot_Bill_Amnt if latest_master else None

            db.add(PaymentTbl(ReferenceNo=c.ReferenceNo, YYMM=target_yyyymm,
                               PaymentDue=payment_due, PaymentMade=0, PaymentDate=None))
            inserted += 1

        db.commit()
        return jsonify({
            "message": f"Deleted {deleted} old rows. Regenerated {inserted} rows for {target_yyyymm} ({skipped} already existed).",
            "deleted": deleted, "inserted": inserted, "skipped": skipped, "targetMonth": target_yyyymm,
        }), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# POST /api/payments/post — port of PaymentPostingHelper.PostPayments
# ══════════════════════════════════════════════════════════════
@payment_bp.route("/post", methods=["POST"])
@admin_required
def post_payments():
    """See PaymentPosting.cs for the exact branching rules this follows
    (before/after due date, then zero/partial/full/extra payment amount)."""
    db = SessionLocal()
    try:
        target_yyyymm = _get_target_yyyymm(db)
        if target_yyyymm is None:
            return jsonify({"error": "Master_Tbl is empty."}), 400

        masters = db.query(MasterTbl).filter_by(Yyyymm=target_yyyymm).all()
        posted = 0

        for master in masters:
            pay = db.query(PaymentTbl).filter_by(ReferenceNo=master.ReferenceNo, YYMM=master.Yyyymm).first()
            if pay is None or pay.PaymentDate is None:
                continue

            due_date_row = db.query(DatesTbl).filter_by(Month=master.Yyyymm).first()
            if due_date_row is None:
                continue

            now= datetime.now()
            due = float(pay.PaymentDue) if pay.PaymentDue is not None else float(master.Tot_Bill_Amnt)
            made = float(pay.PaymentMade)
            before_due_date = pay.PaymentDate <= due_date_row.due_dt
            master.Pmt_Posting= session["user_id"]
            master.Pmt_P_Date = now.date()

            if made == 0:
                master.Paid_Unpaid = "N"
                master.Payment_Made = made
                master.PaymentDate = None
            elif before_due_date:
                master.Paid_Unpaid = "Y" if made == due else ("E" if made > due else "P")
                master.Payment_Made = made
                master.PaymentDate = pay.PaymentDate
            else:
                bill_after_due = float(master.Bill_Amnt_Aftr_Due_Dt) if master.Bill_Amnt_Aftr_Due_Dt is not None else 0
                if made == bill_after_due:
                    master.Paid_Unpaid = "L"
                    master.Payment_Made = made
                    master.PaymentDate = pay.PaymentDate
                elif 0 < made < bill_after_due:
                    master.Paid_Unpaid = "P"
                    master.Payment_Made = made
                    master.PaymentDate = pay.PaymentDate
                # else: made > bill_after_due after the due date isn't covered by
                # the given rules either - left untouched, same as the C# original.

            posted += 1

        db.commit()
        return jsonify({"message": f"Posted {posted} payment(s) for {target_yyyymm}.", "posted": posted}), 200
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# Payment Entry screen endpoints — web equivalent of PaymentForm.cs
# ══════════════════════════════════════════════════════════════
@payment_bp.route("/entry/init", methods=["GET"])
@admin_required
def payment_entry_init():
    db = SessionLocal()
    try:
        target = _get_target_yyyymm(db)
        if target is None:
            return jsonify({"error": "Master_Tbl is empty."}), 400
        refs = [c.ReferenceNo for c in db.query(ConsumerTbl)
                .filter(ConsumerTbl.State != "N").order_by(ConsumerTbl.ReferenceNo).all()]
        if not refs:
            return jsonify({"error": "No consumer records found."}), 404
        last = (db.query(PaymentTbl)
                .filter(PaymentTbl.YYMM == target, PaymentTbl.PaymentMade > 0)
                .order_by(PaymentTbl.ReferenceNo.desc()).first())
        if last is None:
            start_ref = refs[0]
        else:
            idx = refs.index(last.ReferenceNo) if last.ReferenceNo in refs else -1
            start_ref = refs[idx + 1] if 0 <= idx + 1 < len(refs) else refs[-1]
        return jsonify({"targetMonth": target, "refNumbers": refs, "startRef": start_ref}), 200
    finally:
        db.close()


@payment_bp.route("/entry/<int:ref_no>", methods=["GET"])
@admin_required
def payment_entry_get(ref_no):
    db = SessionLocal()
    try:
        target = _get_target_yyyymm(db)
        pay = db.query(PaymentTbl).filter_by(ReferenceNo=ref_no, YYMM=target).first()
        return jsonify({
            "referenceNo": ref_no, "yymm": target,
            "paymentDue": float(pay.PaymentDue) if pay and pay.PaymentDue is not None else 0,
            "paymentMade": float(pay.PaymentMade) if pay else 0,
            "paymentDate": pay.PaymentDate.isoformat() if pay and pay.PaymentDate else "",
        }), 200
    finally:
        db.close()


@payment_bp.route("/entry/<int:ref_no>", methods=["PUT"])
@admin_required
def payment_entry_save(ref_no):
    data = request.get_json(silent=True) or {}
    try:
        made = float(data.get("paymentMade"))
        if made < 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "Payment Made must be a valid non-negative number."}), 400

    pay_date = None
    date_str = (data.get("paymentDate") or "").strip()
    if date_str:
        from datetime import date as _date
        try:
            pay_date = _date.fromisoformat(date_str)
        except ValueError:
            return jsonify({"error": "Payment Date must be a valid date, or left empty."}), 400

    db = SessionLocal()
    try:
        target = _get_target_yyyymm(db)
        existing = db.query(PaymentTbl).filter_by(ReferenceNo=ref_no, YYMM=target).first()
        if existing:
            existing.PaymentMade = made
            existing.PaymentDate = pay_date
        else:
            due_raw = data.get("paymentDue")
            db.add(PaymentTbl(ReferenceNo=ref_no, YYMM=target,
                               PaymentDue=float(due_raw) if due_raw not in (None, "") else 0,
                               PaymentMade=made, PaymentDate=pay_date))
        db.commit()
        return jsonify({"message": "Saved."}), 200
    finally:
        db.close()