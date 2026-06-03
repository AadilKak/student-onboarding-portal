"""Admin-only user management: list users and change roles."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from .extensions import db
from .models import User

bp = Blueprint("users", __name__)

ROLES = {"admin", "teacher", "parent", "staff"}


def _is_admin():
    return (get_jwt() or {}).get("role") == "admin"


@bp.get("/users")
@jwt_required()
def list_users():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    return jsonify([u.to_dict() for u in User.query.order_by(User.email).all()])


@bp.patch("/users/<uid>/role")
@jwt_required()
def set_role(uid):
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    role = (request.get_json(silent=True) or {}).get("role")
    if role not in ROLES:
        return jsonify(error="Invalid role"), 400
    if uid == get_jwt_identity() and role != "admin":
        return jsonify(error="You cannot remove your own admin access."), 400
    user = db.session.get(User, uid)
    if not user:
        return jsonify(error="Not found"), 404
    is_owner = (get_jwt() or {}).get("owner")
    # Only the owner may grant the admin role or change an existing admin.
    if (role == "admin" or user.role == "admin") and not is_owner:
        return jsonify(error="Only the owner can manage admin accounts."), 403
    if user.is_owner and uid != get_jwt_identity():
        return jsonify(error="The owner account cannot be changed."), 403
    user.role = role
    db.session.commit()
    return jsonify(user.to_dict())


@bp.patch("/users/<uid>/rate")
@jwt_required()
def set_rate(uid):
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    rate = (request.get_json(silent=True) or {}).get("hourlyRate")
    try:
        rate = float(rate)
    except (TypeError, ValueError):
        return jsonify(error="Invalid rate"), 400
    if rate < 0:
        return jsonify(error="Rate must be >= 0"), 400
    user = db.session.get(User, uid)
    if not user:
        return jsonify(error="Not found"), 404
    user.hourly_rate = rate
    db.session.commit()
    return jsonify(user.to_dict())
