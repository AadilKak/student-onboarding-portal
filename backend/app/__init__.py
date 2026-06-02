"""Application factory: wires config, extensions, and blueprints."""
from flask import Flask
from flask_cors import CORS

from config import Config
from sqlalchemy import inspect, text
from .extensions import db, jwt
from .models import Student, User  # noqa: F401  (ensure models are registered)


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    origin = app.config.get("FRONTEND_ORIGIN")
    CORS(app, origins=[origin] if origin else "*")
    db.init_app(app)
    jwt.init_app(app)

    from .auth import bp as auth_bp
    from .students import bp as students_bp
    from .files import bp as files_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(files_bp)

    with app.app_context():
        db.create_all()
        _ensure_columns()
        if app.config.get("SEED_DEMO"):
            from .seed import seed_demo
            seed_demo()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


def _ensure_columns():
    """Lightweight auto-migration: add columns introduced after a table was
    first created. db.create_all() does not alter existing tables, so a DB
    made before the `details` column would otherwise reject inserts."""
    inspector = inspect(db.engine)
    if "students" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("students")}
        if "details" not in cols:
            db.session.execute(text("ALTER TABLE students ADD COLUMN details TEXT DEFAULT '{}'"))
            db.session.commit()
