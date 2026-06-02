# Architecture & Roadmap — School Information System (GradeLink replacement)

This document describes the target architecture for turning the current
frontend prototype into real multi-user school-management software.

## Goal

Replace a GradeLink-style SIS with modules for enrollment/onboarding, a student
roster, gradebook, attendance, and role-specific portals for administrators,
teachers, and parents.

## High-level architecture

```
┌─────────────┐      HTTPS / JSON      ┌──────────────┐      SQL      ┌────────────┐
│  React SPA  │  ───────────────────▶  │  Flask API   │  ──────────▶  │ PostgreSQL │
│ (this app)  │  ◀───────────────────  │ (Python)     │  ◀──────────  │            │
└─────────────┘                        └──────────────┘               └────────────┘
        │                                     │
        │                                     ├─ JWT auth / role middleware
        │                                     ├─ business logic (grades, GPA)
        └─ data layer (src/api)               └─ file storage (documents) → S3
```

- **Frontend:** the existing React + TypeScript app. All server access goes
  through a single data layer (`src/api/`) so the rest of the UI never calls
  `fetch` directly. Today that layer reads/writes `localStorage`; swapping it
  for HTTP calls is a localized change.
- **Backend:** Flask (Python) exposing a REST/JSON API. Chosen to match a
  common production stack; FastAPI is a reasonable alternative.
- **Database:** PostgreSQL, accessed via SQLAlchemy.
- **Auth:** JWT access tokens; a role claim (`admin` / `teacher` / `parent`)
  drives both API authorization and which UI a user sees.
- **File storage:** student documents (immunization records, etc.) in S3.

## Core data model

```
User(id, email, password_hash, role)                      role ∈ {admin, teacher, parent}

Guardian(id, user_id, name, email, phone)
Student(id, first_name, last_name, dob, grade_level,
        status, allergies, emergency_contact, emergency_phone, enrolled_at)
GuardianStudent(guardian_id, student_id)                  many-to-many

Enrollment/Application(id, student_id, status, submitted_at)
                                                          status ∈ {submitted, approved, rejected}

Course(id, name, teacher_id, grade_level)
Enrollment(student_id, course_id)
Assignment(id, course_id, title, max_points, due_date)
Grade(id, assignment_id, student_id, points)
Attendance(id, student_id, course_id, date, state)        state ∈ {present, absent, late}
```

Computed values (course average, GPA, attendance rate) are derived on the
backend from `Grade` and `Attendance`, never stored denormalized.

## REST API sketch

```
POST   /auth/login                  → { token, role }
GET    /students                    list (admin/teacher); ?q= search, ?status=
POST   /students                    create
GET    /students/:id                detail
PUT    /students/:id                update
DELETE /students/:id

GET    /applications?status=submitted
POST   /applications                parent submits onboarding form
PATCH  /applications/:id            { status: approved | rejected }

GET    /parents/me/students         parent portal: the caller's children
GET    /courses/:id/grades          gradebook (future)
POST   /attendance                  record attendance (future)
```

Authorization: parents may only read their own children; teachers may read
students and write grades/attendance for their courses; admins have full access.

## Role-based access

| Capability                 | Admin | Teacher | Parent |
|----------------------------|:-----:|:-------:|:------:|
| Review/approve enrollments |  ✓    |         |        |
| Manage student roster      |  ✓    |  read   |        |
| Enter grades / attendance  |  ✓    |  ✓ (own)|        |
| View own child's records   |       |         |  ✓     |

## Phased roadmap

1. **Now — frontend prototype (localStorage).** Onboarding, roster, parent
   portal, role switching. Validates the UX without backend cost.
2. **Backend foundation.** Flask + Postgres, `User`/`Student`/`Guardian` tables,
   JWT auth. Point `src/api/` at the API; remove `localStorage`.
3. **Gradebook & attendance.** Courses, assignments, grades, attendance;
   teacher portal writes, parent portal reads.
4. **Reporting.** Report cards / GPA, attendance summaries, PDF export.
5. **Hardening.** Real accounts, email notifications, audit logging, deploy
   (containerized API on AWS, managed Postgres, S3 for documents).

## Why the data layer matters now

Because every component already talks to `src/api/` instead of `localStorage`
directly, moving to the real backend in phase 2 only changes the functions in
that one folder — the UI components stay the same. That is the main reason the
current refactor is worth doing before adding more features.
