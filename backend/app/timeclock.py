"""Staff time clock: clock in / out, view own entries, admin sees all.
Pay calculation is intentionally left for a later step."""
from datetime import datetime, timezone

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from .extensions import db
from .models import TimeEntry, User

bp = Blueprint("timeclock", __name__)


def _uid():
    return get_jwt_identity()


def _open_entry(uid):
    return TimeEntry.query.filter_by(user_id=uid, clock_out=None).first()


@bp.post("/time/clock-in")
@jwt_required()
def clock_in():
    if _open_entry(_uid()):
        return jsonify(error="You are already clocked in."), 409
    entry = TimeEntry(user_id=_uid())
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@bp.post("/time/clock-out")
@jwt_required()
def clock_out():
    entry = _open_entry(_uid())
    if not entry:
        return jsonify(error="You are not clocked in."), 400
    entry.clock_out = datetime.now(timezone.utc)
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
    if (get_jwt() or {}).get("role") != "admin":
        return jsonify(error="Admins only"), 403
    rows = (db.session.query(TimeEntry, User.email)
            .join(User, User.id == TimeEntry.user_id)
            .order_by(TimeEntry.clock_in.desc()).all())
    return jsonify([e.to_dict(email=email) for e, email in rows])
