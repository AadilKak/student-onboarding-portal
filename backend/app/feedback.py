"""User feedback: anyone logged in can submit; admins read it."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from .extensions import db
from .models import Feedback

bp = Blueprint("feedback", __name__)


@bp.post("/feedback")
@jwt_required()
def submit():
    claims = get_jwt() or {}
    data = request.get_json(silent=True) or {}
    msg = (data.get("message") or "").strip()
    if not msg:
        return jsonify(error="Please enter a message"), 400
    try:
        rating = int(data.get("rating") or 0)
    except (TypeError, ValueError):
        rating = 0
    fb = Feedback(email=claims.get("email", ""), role=claims.get("role", ""),
                  rating=max(0, min(5, rating)), message=msg[:2000])
    db.session.add(fb)
    db.session.commit()
    return jsonify(fb.to_dict()), 201


@bp.get("/feedback")
@jwt_required()
def list_feedback():
    if (get_jwt() or {}).get("role") != "admin":
        return jsonify(error="Admins only"), 403
    rows = Feedback.query.order_by(Feedback.created.desc()).limit(500).all()
    return jsonify([f.to_dict() for f in rows])
