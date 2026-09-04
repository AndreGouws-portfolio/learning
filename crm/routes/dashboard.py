from flask import Blueprint, render_template

from .activities import _JOIN
from .deals import STAGES
from ..db import get_db

bp = Blueprint("dashboard", __name__)

OPEN_STAGES = [s for s in STAGES if s not in ("WON", "LOST")]


@bp.route("/")
def index():
    db = get_db()

    contact_count = db.execute("SELECT COUNT(*) AS n FROM contacts").fetchone()["n"]
    company_count = db.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
    open_task_count = db.execute(
        "SELECT COUNT(*) AS n FROM activities WHERE type = 'TASK' AND completed_at IS NULL"
    ).fetchone()["n"]

    deals = db.execute("SELECT value, stage FROM deals").fetchall()
    open_value = sum(d["value"] for d in deals if d["stage"] not in ("WON", "LOST"))
    won_value = sum(d["value"] for d in deals if d["stage"] == "WON")

    stage_totals = {s: 0 for s in OPEN_STAGES}
    for d in deals:
        if d["stage"] in stage_totals:
            stage_totals[d["stage"]] += d["value"]
    max_stage_value = max(stage_totals.values()) if stage_totals else 0

    upcoming_tasks = db.execute(
        _JOIN + "WHERE a.type = 'TASK' AND a.completed_at IS NULL "
        "ORDER BY a.due_date IS NULL, a.due_date LIMIT 6"
    ).fetchall()

    recent_activity = db.execute(_JOIN + "ORDER BY a.created_at DESC LIMIT 8").fetchall()

    return render_template(
        "dashboard.html",
        contact_count=contact_count,
        company_count=company_count,
        open_task_count=open_task_count,
        open_value=open_value,
        won_value=won_value,
        stage_totals=stage_totals,
        max_stage_value=max_stage_value,
        upcoming_tasks=upcoming_tasks,
        recent_activity=recent_activity,
    )
