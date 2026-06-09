"""Create (or ensure) the four test accounts, regardless of DB state.

Run from the backend folder:  python create_test_accounts.py
"""
from app import create_app
from app.extensions import db
from app.models import User

ACCOUNTS = [
    # email, password, role, hourly_rate, is_owner, full_name
    ("admin@demo.school", "Demo1234!", "admin", 0.0, True, "Sarah Owner"),
    ("admin2@demo.school", "Demo1234!", "admin", 0.0, True, "David Khan"),
    ("teacher@demo.school", "Demo1234!", "teacher", 25.0, False, "James Carter"),
    ("staff@demo.school", "Demo1234!", "staff", 18.0, False, "Maria Lopez"),
    ("parent@demo.school", "Demo1234!", "parent", 0.0, False, "Fartun Korane"),
    ("lead@demo.school", "Demo1234!", "lead", 0.0, False, "Dana Reed"),
    ("contractor", "1234", "contractor", 20.0, False, "Carlos Mendez"),
    ("contractor2", "1234", "contractor", 19.0, False, "Aisha Khan"),
]

app = create_app()
with app.app_context():
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
        print(f"  {role:8} {name:16} {email}  /  {pw}")
    db.session.commit()
print("Test accounts ready.")
