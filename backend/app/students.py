"""Student / application endpoints, mirroring the frontend repository.

Authorization summary:
  - creating an application is open (a prospective parent has no account yet
    in this simple model; in production it would be tied to the logged-in parent)
  - listing/updating/deleting requires a valid JWT
  - the parent portal returns only the caller's own children (by email claim)
"""
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func

from .extensions import db
from .models import Student

bp = Blueprint("students", __name__)

VALID_STATUS = {"submitted", "approved", "rejected"}


def _duplicate_exists(first, last, dob, statuses, exclude_id=None):
    """True if another student with the same name + DOB exists in any of the
    given statuses. Skips the check when name fields are empty."""
    first = (first or "").strip().lower()
    last = (last or "").strip().lower()
    if not first or not last:
        return False
    q = Student.query.filter(
        func.lower(Student.student_first_name) == first,
        func.lower(Student.student_last_name) == last,
        Student.date_of_birth == (dob or ""),
        Student.status.in_(statuses),
    )
    if exclude_id:
        q = q.filter(Student.id != exclude_id)
    return db.session.query(q.exists()).scalar()


@bp.get("/students")
@jwt_required()
def list_students():
    q = request.args.get("q", "").strip().lower()
    status = request.args.get("status")
    query = Student.query
    if status:
        query = query.filter_by(status=status)
    items = [s.to_dict() for s in query.order_by(Student.submitted_at.desc()).all()]
    if q:
        items = [s for s in items if q in f"{s['studentFirstName']} {s['studentLastName']} {s['guardianName']}".lower()]
    return jsonify(items)


@bp.post("/applications")
@jwt_required(optional=True)
def create_application():
    data = request.get_json(silent=True) or {}
    student = Student.from_payload(data)
    if _duplicate_exists(student.student_first_name, student.student_last_name,
                         student.date_of_birth, ("submitted", "approved")):
        return jsonify(error="An application for this student already exists."), 409
    student.status = "submitted"
    # If a parent is logged in, link the application to THEIR account email so
    # the parent portal can always find it. Fall back to the typed email.
    claim_email = (get_jwt() or {}).get("email")
    student.guardian_email = (claim_email or student.guardian_email or "").strip().lower()
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


@bp.post("/students")
@jwt_required()
def create_student():
    # Admin-created student. Defaults to approved (added directly to the roster).
    data = request.get_json(silent=True) or {}
    student = Student.from_payload(data)
    if _duplicate_exists(student.student_first_name, student.student_last_name,
                         student.date_of_birth, ("approved",)):
        return jsonify(error="A student with this name and date of birth is already enrolled."), 409
    student.status = data.get("status", "approved")
    student.guardian_email = (student.guardian_email or "").strip().lower()
    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_dict()), 201


@bp.put("/students/<sid>")
@jwt_required()
def update_student(sid):
    student = db.session.get(Student, sid)
    if not student:
        return jsonify(error="Not found"), 404
    data = request.get_json(silent=True) or {}
    fresh = Student.from_payload(data)
    for col in ("guardian_name", "guardian_email", "guardian_phone", "student_first_name",
                "student_last_name", "date_of_birth", "grade_level", "allergies",
                "emergency_contact", "emergency_phone"):
        setattr(student, col, getattr(fresh, col))
    if "details" in data:
        student.details = json.dumps(data.get("details") or {})
    db.session.commit()
    return jsonify(student.to_dict())


@bp.patch("/students/<sid>/status")
@jwt_required()
def set_status(sid):
    student = db.session.get(Student, sid)
    if not student:
        return jsonify(error="Not found"), 404
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in VALID_STATUS:
        return jsonify(error="Invalid status"), 400
    if status == "approved" and _duplicate_exists(
            student.student_first_name, student.student_last_name,
            student.date_of_birth, ("approved",), exclude_id=student.id):
        return jsonify(error="A student with this name and date of birth is already enrolled."), 409
    student.status = status
    db.session.commit()
    return jsonify(student.to_dict())


@bp.delete("/students/<sid>")
@jwt_required()
def delete_student(sid):
    student = db.session.get(Student, sid)
    if not student:
        return jsonify(error="Not found"), 404
    db.session.delete(student)
    db.session.commit()
    return "", 204


@bp.get("/parents/me/students")
@jwt_required()
def my_students():
    # The parent portal: only this caller's children, by their email claim.
    email = (get_jwt().get("email") or "").strip().lower()
    items = [s.to_dict() for s in
             Student.query.filter(func.lower(Student.guardian_email) == email).all()]
    return jsonify(items)
