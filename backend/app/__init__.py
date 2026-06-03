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
    from .users import bp as users_bp
    from .timeclock import bp as timeclock_bp
    from .payroll import bp as payroll_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(timeclock_bp)
    app.register_blueprint(payroll_bp)

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
    if "users" in inspector.get_table_names():
        ucols = {c["name"] for c in inspector.get_columns("users")}
        if "hourly_rate" not in ucols:
            db.session.execute(text("ALTER TABLE users ADD COLUMN hourly_rate FLOAT DEFAULT 0"))
            db.session.commit()
        if "is_owner" not in ucols:
            db.session.execute(text("ALTER TABLE users ADD COLUMN is_owner BOOLEAN DEFAULT FALSE"))
            db.session.commit()
        if "full_name" not in ucols:
            db.session.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR DEFAULT ''"))
            db.session.commit()
    if "time_entries" in inspector.get_table_names():
        tcols = {c["name"] for c in inspector.get_columns("time_entries")}
        if "approved" not in tcols:
            db.session.execute(text("ALTER TABLE time_entries ADD COLUMN approved BOOLEAN DEFAULT FALSE"))
            db.session.commit()
