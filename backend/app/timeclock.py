"""Staff time clock with anti-fraud controls: clock in/out with a cooldown to
stop accidental double-punches, admin approval, edit/delete with audit logging."""
from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from .extensions import db
from .models import TimeEntry, User, AuditLog

bp = Blueprint("timeclock", __name__)

COOLDOWN = timedelta(seconds=60)  # blocks accidental rapid toggles


def _uid():
    return get_jwt_identity()


def _claims():
    return get_jwt() or {}


def _is_admin():
    return _claims().get("role") == "admin"


def _open_entry(uid):
    return TimeEntry.query.filter_by(user_id=uid, clock_out=None).first()


def _now():
    return datetime.now(timezone.utc)


def _aware(dt):
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _audit(action, detail):
    db.session.add(AuditLog(actor=_claims().get("email", ""), action=action, detail=detail))


@bp.post("/time/clock-in")
@jwt_required()
def clock_in():
    uid = _uid()
    if _open_entry(uid):
        return jsonify(error="You are already clocked in."), 409
    # cooldown: block clock-in right after a clock-out (accidental)
    last = (TimeEntry.query.filter(TimeEntry.user_id == uid, TimeEntry.clock_out.isnot(None))
            .order_by(TimeEntry.clock_out.desc()).first())
    if last and _now() - _aware(last.clock_out) < COOLDOWN:
        return jsonify(error="You just clocked out moments ago. Wait a minute before clocking in again."), 429
    entry = TimeEntry(user_id=uid)
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@bp.post("/time/clock-out")
@jwt_required()
def clock_out():
    entry = _open_entry(_uid())
    if not entry:
        return jsonify(error="You are not clocked in."), 400
    if _now() - _aware(entry.clock_in) < COOLDOWN:
        return jsonify(error="You just clocked in moments ago. Wait a minute before clocking out."), 429
    entry.clock_out = _now()
    db.session.commit()
    return jsonify(entry.to_dict())


@bp.get("/time/me")
@jwt_required()
def my_entries():
    rows = TimeEntry.query.filter_by(user_id=_uid()).order_by(TimeEntry.clock_in.desc()).all()
    return jsonify([e.to_dict() for e in rows])


@bp.get("/time/entries")
@jwt_required()
def all_entries():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    rows = (db.session.query(TimeEntry, User.email, User.full_name)
            .join(User, User.id == TimeEntry.user_id)
            .order_by(TimeEntry.clock_in.desc()).all())
    out = []
    for e, email, name in rows:
        d = e.to_dict(email=email, name=name)
        out.append(d)
    return jsonify(out)


@bp.patch("/time/entries/<eid>/approve")
@jwt_required()
def approve_entry(eid):
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    e = db.session.get(TimeEntry, eid)
    if not e:
        return jsonify(error="Not found"), 404
    e.approved = bool((request.get_json(silent=True) or {}).get("approved", True))
    _audit("approve" if e.approved else "unapprove", f"entry {eid}")
    db.session.commit()
    return jsonify(e.to_dict())


@bp.post("/time/approve-all")
@jwt_required()
def approve_all():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    uid = (request.get_json(silent=True) or {}).get("userId")
    q = TimeEntry.query.filter(TimeEntry.clock_out.isnot(None), TimeEntry.approved.is_(False))
    if uid:
        q = q.filter(TimeEntry.user_id == uid)
    n = 0
    for e in q.all():
        e.approved = True
        n += 1
    _audit("approve-all", f"{n} entries" + (f" for {uid}" if uid else ""))
    db.session.commit()
    return jsonify(approved=n)


@bp.patch("/time/entries/<eid>")
@jwt_required()
def edit_entry(eid):
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    e = db.session.get(TimeEntry, eid)
    if not e:
        return jsonify(error="Not found"), 404
    data = request.get_json(silent=True) or {}
    if data.get("clockIn"):
        e.clock_in = datetime.fromisoformat(data["clockIn"])
    if data.get("clockOut"):
        e.clock_out = datetime.fromisoformat(data["clockOut"])
    _audit("edit", f"entry {eid}")
    db.session.commit()
    return jsonify(e.to_dict())


@bp.delete("/time/entries/<eid>")
@jwt_required()
def delete_entry(eid):
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    e = db.session.get(TimeEntry, eid)
    if not e:
        return jsonify(error="Not found"), 404
    db.session.delete(e)
    _audit("delete", f"entry {eid}")
    db.session.commit()
    return "", 204


@bp.get("/audit")
@jwt_required()
def audit_feed():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    rows = AuditLog.query.order_by(AuditLog.created.desc()).limit(200).all()
    return jsonify([a.to_dict() for a in rows])
