import calendar as calendar_module
from datetime import date, datetime, timedelta

from flask import Blueprint, flash, redirect, render_template, request, url_for

from ..db import get_db
from ..util import safe_next

bp = Blueprint("subscriptions", __name__, url_prefix="/subscriptions")

_JOIN = (
    "SELECT s.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name, "
    "co.name AS company_name FROM subscriptions s "
    "LEFT JOIN contacts c ON c.id = s.contact_id "
    "LEFT JOIN companies co ON co.id = s.company_id "
)


def _contacts(db):
    return db.execute("SELECT id, first_name, last_name, company_id FROM contacts ORDER BY last_name, first_name").fetchall()


def _companies(db):
    return db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()


def _parse_date(value):
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def _advance_due_date(d, cycle):
    """Move a due date forward one billing cycle, clamping to the target month's length."""
    if cycle == "YEARLY":
        year, month = d.year + 1, d.month
    else:
        year, month = (d.year + 1, 1) if d.month == 12 else (d.year, d.month + 1)
    last_day = calendar_module.monthrange(year, month)[1]
    return date(year, month, min(d.day, last_day))


def _form_fields(form):
    return {
        "name": form.get("name", "").strip(),
        "contact_id": form.get("contact_id") or None,
        "company_id": form.get("company_id") or None,
        "next_due_date": form.get("next_due_date") or date.today().isoformat(),
        "billing_cycle": form.get("billing_cycle") or "MONTHLY",
        "amount": float(form.get("amount") or 0) if _is_number(form.get("amount")) else 0,
        "notes": form.get("notes") or None,
    }


def _is_number(value):
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


@bp.route("/")
def index():
    db = get_db()
    rows = db.execute(_JOIN + "ORDER BY s.next_due_date").fetchall()

    active = [r for r in rows if r["status"] == "ACTIVE"]
    inactive = [r for r in rows if r["status"] != "ACTIVE"]

    today = date.today()
    week_end = today + timedelta(days=7)
    month_end = today + timedelta(days=30)
    groups = {"overdue": [], "due_this_week": [], "due_this_month": [], "later": []}
    for r in active:
        d = _parse_date(r["next_due_date"])
        if d is None or d > month_end:
            groups["later"].append(r)
        elif d < today:
            groups["overdue"].append(r)
        elif d <= week_end:
            groups["due_this_week"].append(r)
        else:
            groups["due_this_month"].append(r)

    mrr = sum((r["amount"] if r["billing_cycle"] == "MONTHLY" else r["amount"] / 12) for r in active)

    return render_template(
        "subscriptions/list.html",
        groups=groups,
        inactive=inactive,
        active_count=len(active),
        mrr=mrr,
        due_this_week_count=len(groups["due_this_week"]),
        overdue_count=len(groups["overdue"]),
    )


@bp.route("/new", methods=["GET", "POST"])
def new():
    db = get_db()
    if request.method == "POST":
        fields = _form_fields(request.form)

        error = None
        if not fields["name"]:
            error = "Give the subscription a name."
        elif not fields["contact_id"] and not fields["company_id"]:
            error = "Pick a contact or company to bill."

        if error:
            flash(error)
            return render_template(
                "subscriptions/form.html", subscription=request.form, contacts=_contacts(db), companies=_companies(db)
            )

        db.execute(
            "INSERT INTO subscriptions (name, contact_id, company_id, amount, billing_cycle, next_due_date, notes) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                fields["name"],
                fields["contact_id"],
                fields["company_id"],
                fields["amount"],
                fields["billing_cycle"],
                fields["next_due_date"],
                fields["notes"],
            ),
        )
        db.commit()
        return redirect(url_for("subscriptions.index"))

    prefill = {
        "contact_id": request.args.get("contact_id", type=int),
        "company_id": request.args.get("company_id", type=int),
        "next_due_date": date.today().isoformat(),
        "billing_cycle": "MONTHLY",
        "amount": 440,
    }
    return render_template("subscriptions/form.html", subscription=prefill, contacts=_contacts(db), companies=_companies(db))


@bp.route("/<int:sub_id>/edit", methods=["GET", "POST"])
def edit(sub_id):
    db = get_db()
    subscription = db.execute("SELECT * FROM subscriptions WHERE id = %s", (sub_id,)).fetchone()
    if subscription is None:
        return render_template("404.html"), 404

    if request.method == "POST":
        fields = _form_fields(request.form)

        error = None
        if not fields["name"]:
            error = "Give the subscription a name."
        elif not fields["contact_id"] and not fields["company_id"]:
            error = "Pick a contact or company to bill."

        if error:
            flash(error)
            return render_template(
                "subscriptions/form.html",
                subscription=request.form,
                contacts=_contacts(db),
                companies=_companies(db),
                sub_id=sub_id,
            )

        db.execute(
            "UPDATE subscriptions SET name=%s, contact_id=%s, company_id=%s, amount=%s, "
            "billing_cycle=%s, next_due_date=%s, notes=%s WHERE id=%s",
            (
                fields["name"],
                fields["contact_id"],
                fields["company_id"],
                fields["amount"],
                fields["billing_cycle"],
                fields["next_due_date"],
                fields["notes"],
                sub_id,
            ),
        )
        db.commit()
        return redirect(url_for("subscriptions.index"))

    return render_template(
        "subscriptions/form.html", subscription=subscription, contacts=_contacts(db), companies=_companies(db), sub_id=sub_id
    )


@bp.route("/<int:sub_id>/mark-paid", methods=["POST"])
def mark_paid(sub_id):
    db = get_db()
    subscription = db.execute("SELECT * FROM subscriptions WHERE id = %s", (sub_id,)).fetchone()
    if subscription is not None:
        current_due = _parse_date(subscription["next_due_date"]) or date.today()
        new_due = _advance_due_date(current_due, subscription["billing_cycle"])
        db.execute("UPDATE subscriptions SET next_due_date = %s WHERE id = %s", (new_due.isoformat(), sub_id))
        db.commit()
    return redirect(safe_next(request.form.get("next"), url_for("subscriptions.index")))


@bp.route("/<int:sub_id>/status", methods=["POST"])
def set_status(sub_id):
    db = get_db()
    status = request.form.get("status")
    if status in ("ACTIVE", "PAUSED", "CANCELLED"):
        db.execute("UPDATE subscriptions SET status = %s WHERE id = %s", (status, sub_id))
        db.commit()
    return redirect(safe_next(request.form.get("next"), url_for("subscriptions.index")))


@bp.route("/<int:sub_id>/delete", methods=["POST"])
def delete(sub_id):
    db = get_db()
    db.execute("DELETE FROM subscriptions WHERE id = %s", (sub_id,))
    db.commit()
    return redirect(url_for("subscriptions.index"))
