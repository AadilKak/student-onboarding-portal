"""Auth endpoints: register and login. Returns a JWT carrying the user's role."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from .extensions import db
from .models import User

bp = Blueprint("auth", __name__, url_prefix="/auth")


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify(error="Email and password are required"), 400
    if User.query.filter_by(email=email).first():
        return jsonify(error="An account with that email already exists"), 409

    user = User(email=email, role=data.get("role", "parent"))
    user.full_name = (data.get("name") or "").strip()
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id, additional_claims={"role": user.role, "email": user.email, "owner": user.is_owner})
    return jsonify(token=token, role=user.role, isOwner=user.is_owner), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify(error="Incorrect email or password"), 401

    token = create_access_token(identity=user.id, additional_claims={"role": user.role, "email": user.email, "owner": user.is_owner})
    return jsonify(token=token, role=user.role, isOwner=user.is_owner)
