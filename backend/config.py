import os
from dotenv import load_dotenv

load_dotenv()

def _db_url() -> str:
    url = os.environ.get("DATABASE_URL", "sqlite:///dev.db")
    # Render/Heroku hand out "postgres://"; SQLAlchemy needs the driver form.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    return url


class Config:
    # Default to SQLite so the app runs with zero setup; override with
    # DATABASE_URL (Postgres) in production.
    SQLALCHEMY_DATABASE_URI = _db_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads"))

    # Storage driver: "local" (disk) or "s3".
    STORAGE_BACKEND = os.environ.get("STORAGE_BACKEND", "local")
    S3_BUCKET = os.environ.get("S3_BUCKET")
    S3_REGION = os.environ.get("S3_REGION")
    S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL")  # set for MinIO/local S3

    # Demo: auto-create sample accounts/students when the DB is empty.
    SEED_DEMO = os.environ.get("SEED_DEMO", "0") == "1"
    # Optional: restrict CORS to your deployed frontend (else allow all).
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN")
