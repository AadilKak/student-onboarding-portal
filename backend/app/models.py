"""Database models. Mirrors the frontend's StudentRecord so the React data
layer maps cleanly onto the API."""
from datetime import datetime, timezone
import json
import uuid

from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db


def _uuid() -> str:
    return str(uuid.uuid4())


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String, primary_key=True, default=_uuid)
    email = db.Column(db.String, unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False, default="parent")  # admin/teacher/parent/staff
    hourly_rate = db.Column(db.Float, nullable=False, default=0.0)
    is_owner = db.Column(db.Boolean, nullable=False, default=False)

    # Password handling lives on the server. Werkzeug uses a salted PBKDF2 hash.
    def set_password(self, raw: str) -> None:
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw: str) -> bool:
        return check_password_hash(self.password_hash, raw)

    def to_dict(self) -> dict:
        return {"id": self.id, "email": self.email, "role": self.role, "hourlyRate": self.hourly_rate, "isOwner": self.is_owner}


class Student(db.Model):
    __tablename__ = "students"
    id = db.Column(db.String, primary_key=True, default=_uuid)
    status = db.Column(db.String, nullable=False, default="submitted")  # submitted/approved/rejected
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    guardian_name = db.Column(db.String, default="")
    guardian_email = db.Column(db.String, index=True, default="")
    guardian_phone = db.Column(db.String, default="")

    student_first_name = db.Column(db.String, default="")
    student_last_name = db.Column(db.String, default="")
    date_of_birth = db.Column(db.String, default="")
    grade_level = db.Column(db.String, default="")

    allergies = db.Column(db.String, default="")
    emergency_contact = db.Column(db.String, default="")
    emergency_phone = db.Column(db.String, default="")
    # Full enrollment document (all the extra sections) stored as JSON text.
    details = db.Column(db.Text, default="{}")

    # camelCase keys so the JSON matches the TypeScript StudentRecord exactly.
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "status": self.status,
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else "",
            "guardianName": self.guardian_name,
            "guardianEmail": self.guardian_email,
            "guardianPhone": self.guardian_phone,
            "studentFirstName": self.student_first_name,
            "studentLastName": self.student_last_name,
            "dateOfBirth": self.date_of_birth,
            "gradeLevel": self.grade_level,
            "allergies": self.allergies,
            "emergencyContact": self.emergency_contact,
            "emergencyPhone": self.emergency_phone,
            "details": json.loads(self.details or "{}"),
        }

    @staticmethod
    def from_payload(data: dict) -> "Student":
        return Student(
            guardian_name=data.get("guardianName", ""),
            guardian_email=data.get("guardianEmail", ""),
            guardian_phone=data.get("guardianPhone", ""),
            student_first_name=data.get("studentFirstName", ""),
            student_last_name=data.get("studentLastName", ""),
            date_of_birth=data.get("dateOfBirth", ""),
            grade_level=data.get("gradeLevel", ""),
            allergies=data.get("allergies", ""),
            emergency_contact=data.get("emergencyContact", ""),
            emergency_phone=data.get("emergencyPhone", ""),
            details=json.dumps(data.get("details", {})),
        )


class Attachment(db.Model):
    __tablename__ = "attachments"
    id = db.Column(db.String, primary_key=True, default=_uuid)
    student_id = db.Column(db.String, db.ForeignKey("students.id"), nullable=False, index=True)
    filename = db.Column(db.String, nullable=False)       # original name shown to users
    stored_name = db.Column(db.String, nullable=False)    # name on disk (uuid + ext)
    content_type = db.Column(db.String, default="")
    size = db.Column(db.Integer, default=0)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "studentId": self.student_id,
            "filename": self.filename,
            "contentType": self.content_type,
            "size": self.size,
            "uploadedAt": self.uploaded_at.isoformat() if self.uploaded_at else "",
        }


class TimeEntry(db.Model):
    __tablename__ = "time_entries"
    id = db.Column(db.String, primary_key=True, default=_uuid)
    user_id = db.Column(db.String, db.ForeignKey("users.id"), nullable=False, index=True)
    clock_in = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    clock_out = db.Column(db.DateTime, nullable=True)

    def to_dict(self, email=None) -> dict:
        return {
            "id": self.id,
            "userId": self.user_id,
            "email": email,
            "clockIn": self.clock_in.isoformat() if self.clock_in else None,
            "clockOut": self.clock_out.isoformat() if self.clock_out else None,
            "open": self.clock_out is None,
        }
