from datetime import date, datetime, timedelta

from flask import Blueprint, redirect, render_template, request, url_for

from ..db import get_db
from ..util import safe_next

bp = Blueprint("activities", __name__)

_JOIN = (
    "SELECT a.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name, "
    "d.title AS deal_title, co.name AS company_name FROM activities a "
    "LEFT JOIN contacts c ON c.id = a.contact_id "
    "LEFT JOIN deals d ON d.id = a.deal_id "
    "LEFT JOIN companies co ON co.id = a.company_id "
)


def _due_date(row):
    if not row["due_date"]:
        return None
    try:
        return datetime.strptime(row["due_date"][:10], "%Y-%m-%d").date()
    except ValueError:
        return None


@bp.route("/tasks")
def tasks():
    db = get_db()
    rows = db.execute(_JOIN + "WHERE a.type = 'TASK' ORDER BY a.due_date IS NULL, a.due_date").fetchall()

    pending = [r for r in rows if not r["completed_at"]]
    completed = sorted(
        (r for r in rows if r["completed_at"]),
        key=lambda r: r["completed_at"],
        reverse=True,
    )[:20]

    today = date.today()
    week_end = today + timedelta(days=7)
    groups = {"overdue": [], "due_today": [], "this_week": [], "later": [], "no_date": []}
    for r in pending:
        d = _due_date(r)
        if d is None:
            groups["no_date"].append(r)
        elif d < today:
            groups["overdue"].append(r)
        elif d == today:
            groups["due_today"].append(r)
        elif d <= week_end:
            groups["this_week"].append(r)
        else:
            groups["later"].append(r)

    open_new = request.args.get("new") == "1"
    return render_template(
        "tasks/list.html",
        pending=pending,
        completed=completed,
        groups=groups,
        open_new=open_new,
    )


@bp.route("/activities/new", methods=["POST"])
def create():
    db = get_db()
    title = request.form.get("title", "").strip()
    next_url = safe_next(request.form.get("next"), url_for("activities.tasks"))
    if not title:
        return redirect(next_url)

    activity_type = request.form.get("type") or "TASK"
    completed_at = datetime.now().isoformat(timespec="seconds") if activity_type == "NOTE" else None

    db.execute(
        "INSERT INTO activities (type, title, notes, due_date, contact_id, deal_id, company_id, completed_at) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (
            activity_type,
            title,
            request.form.get("notes") or None,
            request.form.get("due_date") or None,
            request.form.get("contact_id") or None,
            request.form.get("deal_id") or None,
            request.form.get("company_id") or None,
            completed_at,
        ),
    )
    db.commit()
    return redirect(next_url)


@bp.route("/activities/<int:activity_id>/toggle", methods=["POST"])
def toggle(activity_id):
    db = get_db()
    completed = request.form.get("completed") == "1"
    completed_at = datetime.now().isoformat(timespec="seconds") if completed else None
    db.execute("UPDATE activities SET completed_at = %s WHERE id = %s", (completed_at, activity_id))
    db.commit()
    return redirect(safe_next(request.form.get("next"), url_for("activities.tasks")))


@bp.route("/activities/<int:activity_id>/delete", methods=["POST"])
def delete(activity_id):
    db = get_db()
    db.execute("DELETE FROM activities WHERE id = %s", (activity_id,))
    db.commit()
    return redirect(safe_next(request.form.get("next"), url_for("activities.tasks")))
