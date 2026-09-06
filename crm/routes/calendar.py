import calendar as calendar_module
from datetime import date

from flask import Blueprint, render_template, request, url_for

from .activities import _JOIN
from ..db import get_db

bp = Blueprint("calendar", __name__, url_prefix="/calendar")

TYPE_BADGE = {
    "TASK": "badge-blue",
    "CALL": "badge-purple",
    "EMAIL": "badge-amber",
    "MEETING": "badge-green",
    "NOTE": "",
}


def _companies(db):
    return db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()


def _contacts(db):
    return db.execute("SELECT id, first_name, last_name FROM contacts ORDER BY last_name, first_name").fetchall()


def _deals(db):
    return db.execute("SELECT id, title FROM deals ORDER BY title").fetchall()


@bp.route("/")
def index():
    db = get_db()
    today = date.today()
    year = request.args.get("year", type=int) or today.year
    month = request.args.get("month", type=int) or today.month
    # Clamp so a hand-edited URL (e.g. month=13) can't blow up date().
    month = max(1, min(12, month))

    weeks = calendar_module.Calendar(firstweekday=0).monthdatescalendar(year, month)
    grid_start = weeks[0][0].isoformat()
    grid_end = weeks[-1][-1].isoformat()

    rows = db.execute(
        _JOIN + "WHERE a.due_date IS NOT NULL AND a.due_date BETWEEN %s AND %s "
        "ORDER BY a.due_date, a.created_at",
        (grid_start, grid_end),
    ).fetchall()

    by_date = {}
    for r in rows:
        by_date.setdefault(r["due_date"][:10], []).append(r)

    day_grid = [
        [
            {
                "date": d,
                "iso": d.isoformat(),
                "in_month": d.month == month,
                "is_today": d == today,
                "activities": by_date.get(d.isoformat(), []),
            }
            for d in week
        ]
        for week in weeks
    ]

    prev_month, prev_year = (12, year - 1) if month == 1 else (month - 1, year)
    next_month, next_year = (1, year + 1) if month == 12 else (month + 1, year)

    selected_date = request.args.get("date") or ""

    return render_template(
        "calendar/index.html",
        day_grid=day_grid,
        month_label=date(year, month, 1).strftime("%B %Y"),
        year=year,
        month=month,
        prev_year=prev_year,
        prev_month=prev_month,
        next_year=next_year,
        next_month=next_month,
        is_current_month=(year == today.year and month == today.month),
        companies=_companies(db),
        contacts=_contacts(db),
        deals=_deals(db),
        selected_date=selected_date or today.isoformat(),
        open_new=bool(selected_date),
        type_badge=TYPE_BADGE,
        back_url=url_for("calendar.index", year=year, month=month),
    )
