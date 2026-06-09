"""Admin-to-admin direct messaging."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from .extensions import db
from .models import Message, User

bp = Blueprint("messages", __name__)


def _claims():
    return get_jwt() or {}


def _is_admin():
    return _claims().get("role") == "admin"


@bp.get("/messages")
@jwt_required()
def inbox():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    me = _claims().get("email", "")
    rows = (Message.query
            .filter((Message.sender == me) | (Message.recipient == me))
            .order_by(Message.created.desc()).limit(500).all())
    return jsonify([m.to_dict() for m in rows])


@bp.post("/messages")
@jwt_required()
def send():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    data = request.get_json(silent=True) or {}
    to = (data.get("to") or "").strip().lower()
    body = (data.get("body") or "").strip()
    if not to or not body:
        return jsonify(error="Recipient and message are required"), 400
    recipient = User.query.filter_by(email=to).first()
    if not recipient or recipient.role != "admin":
        return jsonify(error="Recipient must be an admin"), 400
    m = Message(sender=_claims().get("email", ""), recipient=to, body=body[:4000])
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@bp.post("/messages/read")
@jwt_required()
def mark_read():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    me = _claims().get("email", "")
    for m in Message.query.filter_by(recipient=me, read=False).all():
        m.read = True
    db.session.commit()
    return jsonify(ok=True)
