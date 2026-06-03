"""Biweekly payroll calculation.

Overtime follows the FLSA rule: hours over 40 in a single workweek are paid at
1.5x. We bucket each completed time entry by its ISO (year, week), sum hours per
week, then split into regular (<=40/week) and overtime (>40/week).
"""
from datetime import datetime, date, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from .extensions import db
from .models import TimeEntry, User

bp = Blueprint("payroll", __name__)


def _is_admin():
    return (get_jwt() or {}).get("role") == "admin"


def _parse(d, default):
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return default


@bp.get("/payroll")
@jwt_required()
def payroll():
    if not _is_admin():
        return jsonify(error="Admins only"), 403

    today = date.today()
    start = _parse(request.args.get("start"), today - timedelta(days=13))
    end = _parse(request.args.get("end"), today)

    # Pull completed entries whose clock-in date falls in the range.
    rows = (db.session.query(TimeEntry, User)
            .join(User, User.id == TimeEntry.user_id)
            .filter(TimeEntry.clock_out.isnot(None))
            .all())

    # Per user: { (iso_year, iso_week): approved_hours }, plus unapproved hours.
    per_user = {}
    unapproved = {}
    meta = {}
    for entry, user in rows:
        d = entry.clock_in.date()
        if d < start or d > end:
            continue
        hrs = (entry.clock_out - entry.clock_in).total_seconds() / 3600.0
        meta[user.id] = user
        if not entry.approved:
            unapproved[user.id] = unapproved.get(user.id, 0.0) + hrs
            continue
        wk = entry.clock_in.isocalendar()[:2]
        per_user.setdefault(user.id, {})
        per_user[user.id][wk] = per_user[user.id].get(wk, 0.0) + hrs

    result = []
    for uid in meta:
        weeks = per_user.get(uid, {})
        regular = sum(min(h, 40.0) for h in weeks.values())
        overtime = sum(max(h - 40.0, 0.0) for h in weeks.values())
        rate = meta[uid].hourly_rate or 0.0
        gross = regular * rate + overtime * rate * 1.5
        result.append({
            "userId": uid,
            "email": meta[uid].email,
            "name": meta[uid].full_name,
            "role": meta[uid].role,
            "hourlyRate": rate,
            "regularHours": round(regular, 2),
            "overtimeHours": round(overtime, 2),
            "unapprovedHours": round(unapproved.get(uid, 0.0), 2),
            "grossPay": round(gross, 2),
        })
    result.sort(key=lambda r: r["email"])
    return jsonify({"start": start.isoformat(), "end": end.isoformat(), "rows": result})
