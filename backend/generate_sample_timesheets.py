"""Generate sample clock in/out entries so payroll shows real numbers.

Creates ~2 weeks of weekday shifts for the demo staff & teacher, with one week
of mild overtime so you can see OT calculate. Re-running replaces their entries.

Run from the backend folder:  python generate_sample_timesheets.py
"""
from datetime import datetime, timedelta, timezone, date

from app import create_app
from app.extensions import db
from app.models import User, TimeEntry

# email -> list of (days_ago_start, hours_per_day) shift blocks
PLAN = {
    "contractor":  [(12, 6), (10, 7), (9, 8), (5, 6), (3, 7), (2, 6), (1, 7)],
    "contractor2": [(11, 8), (10, 6), (8, 7), (4, 8), (3, 6), (2, 7)],
}

app = create_app()
with app.app_context():
    today = date.today()
    for email, shifts in PLAN.items():
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"  (skip) no account for {email}")
            continue
        # clear existing entries for a clean, repeatable demo
        TimeEntry.query.filter_by(user_id=user.id).delete()
        total = 0.0
        for days_ago, hrs in shifts:
            d = today - timedelta(days=days_ago)
            ci = datetime(d.year, d.month, d.day, 8, 0, tzinfo=timezone.utc)
            co = ci + timedelta(hours=hrs)
            db.session.add(TimeEntry(user_id=user.id, clock_in=ci, clock_out=co, approved=True))
            total += hrs
        print(f"  {email}: {len(shifts)} shifts, {total:.0f} hours")
    db.session.commit()
print("Sample timesheets created. Open the Payroll tab and Calculate.")
