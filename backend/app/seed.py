"""Demo seed data. Runs when SEED_DEMO=1. Idempotent: it ensures the demo
accounts exist (so demo login works on a deployed site even if the database
already has data), and adds sample students only if there are none yet."""
from datetime import datetime, timedelta, timezone, date

from .extensions import db
from .models import User, Student, TimeEntry

# email, password, role, hourly_rate, is_owner, full_name
ACCOUNTS = [
    ("admin@demo.school", "Demo1234!", "admin", 0.0, True, "Sarah Owner"),
    ("teacher@demo.school", "Demo1234!", "teacher", 25.0, False, "James Carter"),
    ("staff@demo.school", "Demo1234!", "staff", 18.0, False, "Maria Lopez"),
    ("parent@demo.school", "Demo1234!", "parent", 0.0, False, "Fartun Korane"),
    ("lead@demo.school", "Demo1234!", "lead", 0.0, False, "Dana Reed"),
    ("contractor", "1234", "contractor", 20.0, False, "Carlos Mendez"),
    ("contractor2", "1234", "contractor", 19.0, False, "Aisha Khan"),
]


def _student(first, last, dob, grade, status, guardian_email, guardian_name):
    return Student(status=status, guardian_email=guardian_email, guardian_name=guardian_name,
                   student_first_name=first, student_last_name=last, date_of_birth=dob, grade_level=grade)


def seed_demo():
    # Ensure the demo accounts exist / are correct (upsert).
    for email, pw, role, rate, owner, name in ACCOUNTS:
        u = User.query.filter_by(email=email).first()
        if not u:
            u = User(email=email)
            u.set_password(pw)
            db.session.add(u)
        u.role = role
        u.hourly_rate = rate
        u.is_owner = owner
        u.full_name = name

    db.session.flush()  # ensure demo users have ids for timesheets below

    # Sample timesheets (approved) only if there are no time entries yet, so the
    # Time Entries and Payroll tabs show real data on a fresh deploy.
    if TimeEntry.query.first() is None:
        plan = {
            "contractor":  [(12, 6), (10, 7), (9, 8), (5, 6), (3, 7), (2, 6), (1, 7)],
            "contractor2": [(11, 8), (10, 6), (8, 7), (4, 8), (3, 6), (2, 7)],
        }
        today = date.today()
        for email, shifts in plan.items():
            u = User.query.filter_by(email=email).first()
            if not u:
                continue
            for days_ago, hrs in shifts:
                d = today - timedelta(days=days_ago)
                ci = datetime(d.year, d.month, d.day, 8, 0, tzinfo=timezone.utc)
                db.session.add(TimeEntry(user_id=u.id, clock_in=ci, clock_out=ci + timedelta(hours=hrs), approved=True))

    # Sample students only if the roster is empty.
    if Student.query.first() is None:
        db.session.add_all([
            _student("Ikhlas", "Ali", "2020-10-25", "Pre-Kindergarten", "approved", "parent@demo.school", "Fartun Korane"),
            _student("Yusuf", "Ali", "2018-03-14", "1", "submitted", "parent@demo.school", "Fartun Korane"),
            _student("Amina", "Hassan", "2017-06-02", "2", "approved", "other@demo.school", "Hassan Omar"),
            _student("Bilal", "Noor", "2016-09-19", "3", "approved", "noor@demo.school", "Noor Aden"),
        ])
    db.session.commit()
