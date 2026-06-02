"""File attachment endpoints. Files are stored on disk (UPLOAD_DIR) with a
random stored name; the database keeps the metadata. In production this disk
folder would be swapped for S3 — only this module changes."""
import io
import os
import uuid

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

from .extensions import db
from .models import Attachment, Student
from .storage import get_storage

bp = Blueprint("files", __name__)

MAX_BYTES = 10 * 1024 * 1024  # 10 MB per file


@bp.get("/students/<sid>/files")
@jwt_required()
def list_files(sid):
    items = [a.to_dict() for a in Attachment.query.filter_by(student_id=sid).order_by(Attachment.uploaded_at).all()]
    return jsonify(items)


@bp.post("/students/<sid>/files")
@jwt_required()
def upload_file(sid):
    if not db.session.get(Student, sid):
        return jsonify(error="Student not found"), 404
    f = request.files.get("file")
    if not f or not f.filename:
        return jsonify(error="No file provided"), 400

    f.seek(0, os.SEEK_END); size = f.tell(); f.seek(0)
    if size > MAX_BYTES:
        return jsonify(error="File exceeds 10 MB limit"), 413

    original = secure_filename(f.filename)
    ext = os.path.splitext(original)[1]
    stored = f"{uuid.uuid4().hex}{ext}"
    get_storage().save(stored, f, f.mimetype or None)

    att = Attachment(student_id=sid, filename=original, stored_name=stored,
                     content_type=f.mimetype or "", size=size)
    db.session.add(att)
    db.session.commit()
    return jsonify(att.to_dict()), 201


@bp.get("/files/<fid>")
@jwt_required()
def download_file(fid):
    att = db.session.get(Attachment, fid)
    if not att:
        return jsonify(error="Not found"), 404
    try:
        data = get_storage().read(att.stored_name)
    except Exception:
        return jsonify(error="File missing from storage"), 404
    return send_file(io.BytesIO(data), as_attachment=True, download_name=att.filename,
                     mimetype=att.content_type or None)


@bp.delete("/files/<fid>")
@jwt_required()
def delete_file(fid):
    att = db.session.get(Attachment, fid)
    if not att:
        return jsonify(error="Not found"), 404
    get_storage().delete(att.stored_name)
    db.session.delete(att)
    db.session.commit()
    return "", 204
