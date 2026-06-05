"""Admin-only user management: list users and change roles."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from .extensions import db
from .models import User

bp = Blueprint("users", __name__)

ROLES = {"admin", "teacher", "parent", "staff", "lead", "contractor"}


def _is_admin():
    return (get_jwt() or {}).get("role") == "admin"


@bp.get("/users")
@jwt_required()
def list_users():
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    return jsonify([u.to_dict() for u in User.query.order_by(User.email).all()])


@bp.post("/users")
@jwt_required()
def create_user():
    """Admin creates an account (e.g. contractor or lead). Username goes in the
    email field; PIN goes in the password. Contractors never self-register."""
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or data.get("email") or "").strip().lower()
    pin = data.get("pin") or data.get("password") or ""
    role = data.get("role", "contractor")
    if not username or not pin:
        return jsonify(error="Username and PIN are required"), 400
    if role not in ROLES:
        return jsonify(error="Invalid role"), 400
    if role == "admin" and not (get_jwt() or {}).get("owner"):
        return jsonify(error="Only the owner can create admins"), 403
    if User.query.filter_by(email=username).first():
        return jsonify(error="That username already exists"), 409
    u = User(email=username, role=role)
    u.full_name = (data.get("name") or "").strip()
    try:
        u.hourly_rate = float(data.get("hourlyRate") or 0)
    except (TypeError, ValueError):
        u.hourly_rate = 0.0
    u.set_password(pin)
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict()), 201


@bp.delete("/users/<uid>")
@jwt_required()
def delete_user(uid):
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    user = db.session.get(User, uid)
    if not user:
        return jsonify(error="Not found"), 404
    if user.is_owner:
        return jsonify(error="The owner account cannot be removed."), 403
    if uid == get_jwt_identity():
        return jsonify(error="You cannot remove your own account."), 400
    if user.role == "admin" and not (get_jwt() or {}).get("owner"):
        return jsonify(error="Only the owner can remove an admin."), 403
    db.session.delete(user)
    db.session.commit()
    return "", 204


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


@bp.patch("/users/<uid>/name")
@jwt_required()
def set_name(uid):
    if not _is_admin():
        return jsonify(error="Admins only"), 403
    name = (request.get_json(silent=True) or {}).get("name", "")
    user = db.session.get(User, uid)
    if not user:
        return jsonify(error="Not found"), 404
    user.full_name = str(name).strip()
    db.session.commit()
    return jsonify(user.to_dict())
