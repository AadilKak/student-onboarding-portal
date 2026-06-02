# Backend — School Information System API

Flask + SQLAlchemy REST API for the onboarding portal. JWT auth, Postgres in
production (SQLite by default for zero-setup local dev).

## Run locally (SQLite, no setup)

```bash
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL="sqlite:///dev.db"            # Windows (PowerShell): $env:DATABASE_URL="sqlite:///dev.db"
export JWT_SECRET_KEY="dev-secret-change-me"
python wsgi.py                                     # serves http://localhost:5000
```

## Run with Postgres (production-like)

```bash
docker compose up -d                 # starts Postgres on :5432
cp .env.example .env                 # uses the postgresql:// DATABASE_URL
pip install -r requirements.txt
python wsgi.py
```

## Endpoints

| Method | Path                       | Auth        | Purpose                         |
|--------|----------------------------|-------------|---------------------------------|
| GET    | /health                    | none        | Liveness check                  |
| POST   | /auth/register             | none        | Create account → `{token,role}` |
| POST   | /auth/login                | none        | Log in → `{token,role}`         |
| POST   | /applications              | none        | Submit an enrollment            |
| GET    | /students?q=&status=       | JWT         | List students (admin/teacher)   |
| PUT    | /students/:id              | JWT         | Update a student record         |
| PATCH  | /students/:id/status       | JWT         | Approve / reject                |
| DELETE | /students/:id              | JWT         | Remove a record                 |
| GET    | /parents/me/students       | JWT         | Caller's own children           |

Send the token as `Authorization: Bearer <token>`.

## Security notes

- Passwords are hashed server-side with Werkzeug (salted PBKDF2) — the client
  never stores or hashes passwords. This replaces the prototype's localStorage hash.
- Set a strong `JWT_SECRET_KEY` (32+ bytes) in production.
- Tighten authorization next: restrict approve/delete to `admin`, grades to the
  owning `teacher`, etc., using the `role` claim in the JWT.

## File storage (local or S3)

Attachments are written through a storage driver selected by `STORAGE_BACKEND`:

```bash
# Local disk (default)
STORAGE_BACKEND=local
UPLOAD_DIR=./uploads

# Amazon S3
STORAGE_BACKEND=s3
S3_BUCKET=my-school-bucket
S3_REGION=us-east-1
# AWS credentials come from the environment / instance role.
# S3_ENDPOINT_URL=http://localhost:9000   # optional, for MinIO/local testing
```

The endpoints in `files.py` call `get_storage()` and are identical for both
backends, so switching to S3 is purely a config change (see `app/storage.py`).

## Connecting the frontend

The React app's data layer (`src/api/repository.ts`) currently uses
localStorage. To use this API instead, replace those functions with `fetch`
calls — JSON shapes already match `StudentRecord`. Example:

```ts
const API = "http://localhost:5000";
let token = localStorage.getItem("token") ?? "";

export async function listStudents() {
  const res = await fetch(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}
export async function createApplication(record) {
  await fetch(`${API}/applications`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record),
  });
}
```

Because every component already calls `repository.ts` (never `fetch` or
localStorage directly), this is the only file that changes.
