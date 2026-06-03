"""Create (or ensure) the four test accounts, regardless of DB state.

Run from the backend folder:  python create_test_accounts.py
"""
from app import create_app
from app.extensions import db
from app.models import User

ACCOUNTS = [
    # email, password, role, hourly_rate, is_owner
    ("admin@demo.school", "Demo1234!", "admin", 0.0, True),
    ("teacher@demo.school", "Demo1234!", "teacher", 25.0, False),
    ("staff@demo.school", "Demo1234!", "staff", 18.0, False),
    ("parent@demo.school", "Demo1234!", "parent", 0.0, False),
]

app = create_app()
with app.app_context():
    for email, pw, role, rate, owner in ACCOUNTS:
        u = User.query.filter_by(email=email).first()
        if not u:
            u = User(email=email)
            u.set_password(pw)
            db.session.add(u)
        u.role = role
        u.hourly_rate = rate
        u.is_owner = owner
        print(f"  {role:8} {email}  /  {pw}  (rate ${rate}{', OWNER' if owner else ''})")
    db.session.commit()
print("Test accounts ready.")
