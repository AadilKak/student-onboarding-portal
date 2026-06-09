"""Notes about a worker. Contractors can leave a note for the admin (e.g.
"I missed a clock-in"); admins/leads can read them and add their own."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from .extensions import db
from .models import Note, User

bp = Blueprint("notes", __name__)


def _claims():
    return get_jwt() or {}


def _can_review():
    return _claims().get("role") in ("admin", "lead")


@bp.post("/notes")
@jwt_required()
def add_note():
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return jsonify(error="Please enter a note"), 400
    # Admin/lead can attach a note to anyone; others can only note themselves.
    subject = data.get("subjectUserId")
    if subject and not _can_review():
        return jsonify(error="Not authorized"), 403
    subject = subject or get_jwt_identity()
    if not db.session.get(User, subject):
        return jsonify(error="Unknown subject"), 404
    note = Note(subject_id=subject, author=_claims().get("email", ""), body=body[:2000])
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201


@bp.get("/notes")
@jwt_required()
def all_notes():
    if not _can_review():
        return jsonify(error="Not authorized"), 403
    rows = (db.session.query(Note, User.full_name, User.email)
            .join(User, User.id == Note.subject_id)
            .order_by(Note.created.desc()).limit(500).all())
    out = []
    for n, name, email in rows:
        d = n.to_dict()
        d["subjectName"] = name
        d["subjectEmail"] = email
        out.append(d)
    return jsonify(out)


@bp.get("/notes/me")
@jwt_required()
def my_notes():
    rows = Note.query.filter_by(subject_id=get_jwt_identity()).order_by(Note.created.desc()).all()
    return jsonify([n.to_dict() for n in rows])


@bp.get("/users/<uid>/notes")
@jwt_required()
def user_notes(uid):
    if not _can_review():
        return jsonify(error="Not authorized"), 403
    rows = Note.query.filter_by(subject_id=uid).order_by(Note.created.desc()).all()
    return jsonify([n.to_dict() for n in rows])


@bp.patch("/notes/<nid>")
@jwt_required()
def update_note(nid):
    """Admin/lead responds to and/or resolves a note."""
    if not _can_review():
        return jsonify(error="Not authorized"), 403
    note = db.session.get(Note, nid)
    if not note:
        return jsonify(error="Not found"), 404
    data = request.get_json(silent=True) or {}
    if "response" in data:
        note.response = str(data["response"]).strip()[:2000]
    if "resolved" in data:
        note.resolved = bool(data["resolved"])
    db.session.commit()
    return jsonify(note.to_dict())


@bp.delete("/notes/<nid>")
@jwt_required()
def delete_note(nid):
    if not _can_review():
        return jsonify(error="Not authorized"), 403
    note = db.session.get(Note, nid)
    if not note:
        return jsonify(error="Not found"), 404
    db.session.delete(note)
    db.session.commit()
    return "", 204
