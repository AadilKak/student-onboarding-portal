"""Demo seed data. Runs only when SEED_DEMO=1 and the database is empty, so a
freshly deployed instance shows a populated school instead of a blank app."""
from .extensions import db
from .models import User, Student

DEMO_ADMIN = ("admin@demo.school", "Demo1234!")
DEMO_PARENT = ("parent@demo.school", "Demo1234!")
DEMO_TEACHER = ("teacher@demo.school", "Demo1234!")
DEMO_STAFF = ("staff@demo.school", "Demo1234!")


def _student(first, last, dob, grade, status, guardian_email, guardian_name):
    return Student(
        status=status, guardian_email=guardian_email, guardian_name=guardian_name,
        student_first_name=first, student_last_name=last, date_of_birth=dob, grade_level=grade,
    )


def seed_demo():
    if User.query.first():
        return  # already seeded / has data

    accounts = [
        (DEMO_ADMIN, "admin"), (DEMO_PARENT, "parent"),
        (DEMO_TEACHER, "teacher"), (DEMO_STAFF, "staff"),
    ]
    rates = {"staff": 18.0, "teacher": 25.0}
    for (email, pw), role in accounts:
        u = User(email=email, role=role); u.set_password(pw)
        u.hourly_rate = rates.get(role, 0.0)
        if role == "admin":
            u.is_owner = True
        db.session.add(u)

    db.session.add_all([
        _student("Ikhlas", "Ali", "2020-10-25", "Pre-Kindergarten", "approved", DEMO_PARENT[0], "Fartun Korane"),
        _student("Yusuf", "Ali", "2018-03-14", "1", "submitted", DEMO_PARENT[0], "Fartun Korane"),
        _student("Amina", "Hassan", "2017-06-02", "2", "approved", "other@demo.school", "Hassan Omar"),
        _student("Bilal", "Noor", "2016-09-19", "3", "approved", "noor@demo.school", "Noor Aden"),
        _student("Sara", "Yusuf", "2019-12-01", "Kindergarten", "submitted", "yusuf@demo.school", "Yusuf Abdi"),
    ])
    db.session.commit()
