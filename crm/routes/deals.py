from datetime import date

from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for

from ..db import get_db

bp = Blueprint("deals", __name__, url_prefix="/deals")

STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]


def _companies(db):
    return db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()


def _contacts(db):
    return db.execute("SELECT id, first_name, last_name FROM contacts ORDER BY last_name, first_name").fetchall()


@bp.route("/")
def index():
    db = get_db()
    rows = db.execute(
        "SELECT d.*, co.name AS company_name, c.first_name AS contact_first_name, "
        "c.last_name AS contact_last_name FROM deals d "
        "LEFT JOIN companies co ON co.id = d.company_id "
        "LEFT JOIN contacts c ON c.id = d.contact_id "
        "ORDER BY d.created_at DESC"
    ).fetchall()

    columns = {stage: [] for stage in STAGES}
    for d in rows:
        columns[d["stage"]].append(d)

    open_value = sum(d["value"] for d in rows if d["stage"] not in ("WON", "LOST"))

    return render_template(
        "deals/board.html", columns=columns, stages=STAGES, deal_count=len(rows), open_value=open_value
    )


@bp.route("/new", methods=["GET", "POST"])
def new():
    db = get_db()
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        if not title:
            flash("Deal title is required.")
            return render_template(
                "deals/form.html", deal=request.form, companies=_companies(db),
                contacts=_contacts(db), stages=STAGES,
            )

        stage = request.form.get("stage") or "LEAD"
        closed_at = date.today().isoformat() if stage in ("WON", "LOST") else None
        cur = db.execute(
            "INSERT INTO deals (title, value, stage, company_id, contact_id, expected_close_date, notes, closed_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                title,
                float(request.form.get("value") or 0),
                stage,
                request.form.get("company_id") or None,
                request.form.get("contact_id") or None,
                request.form.get("expected_close_date") or None,
                request.form.get("notes") or None,
                closed_at,
            ),
        )
        db.commit()
        return redirect(url_for("deals.detail", deal_id=cur.lastrowid))

    return render_template(
        "deals/form.html", deal=None, companies=_companies(db), contacts=_contacts(db), stages=STAGES
    )


@bp.route("/<int:deal_id>")
def detail(deal_id):
    db = get_db()
    deal = db.execute(
        "SELECT d.*, co.name AS company_name, c.first_name AS contact_first_name, "
        "c.last_name AS contact_last_name FROM deals d "
        "LEFT JOIN companies co ON co.id = d.company_id "
        "LEFT JOIN contacts c ON c.id = d.contact_id WHERE d.id = ?",
        (deal_id,),
    ).fetchone()
    if deal is None:
        return render_template("404.html"), 404

    activities = db.execute(
        "SELECT * FROM activities WHERE deal_id = ? ORDER BY created_at DESC", (deal_id,)
    ).fetchall()
    return render_template("deals/detail.html", deal=deal, activities=activities)


@bp.route("/<int:deal_id>/edit", methods=["GET", "POST"])
def edit(deal_id):
    db = get_db()
    deal = db.execute("SELECT * FROM deals WHERE id = ?", (deal_id,)).fetchone()
    if deal is None:
        return render_template("404.html"), 404
    deal = dict(deal)

    if request.method == "POST":
        title = request.form.get("title", "").strip()
        if not title:
            flash("Deal title is required.")
            return render_template(
                "deals/form.html", deal=request.form, companies=_companies(db),
                contacts=_contacts(db), stages=STAGES, deal_id=deal_id,
            )

        stage = request.form.get("stage") or "LEAD"
        closed_at = date.today().isoformat() if stage in ("WON", "LOST") else None
        db.execute(
            "UPDATE deals SET title=?, value=?, stage=?, company_id=?, contact_id=?, "
            "expected_close_date=?, notes=?, closed_at=? WHERE id=?",
            (
                title,
                float(request.form.get("value") or 0),
                stage,
                request.form.get("company_id") or None,
                request.form.get("contact_id") or None,
                request.form.get("expected_close_date") or None,
                request.form.get("notes") or None,
                closed_at,
                deal_id,
            ),
        )
        db.commit()
        return redirect(url_for("deals.detail", deal_id=deal_id))

    return render_template(
        "deals/form.html", deal=deal, companies=_companies(db), contacts=_contacts(db),
        stages=STAGES, deal_id=deal_id,
    )


@bp.route("/<int:deal_id>/delete", methods=["POST"])
def delete(deal_id):
    db = get_db()
    db.execute("DELETE FROM deals WHERE id = ?", (deal_id,))
    db.commit()
    return redirect(url_for("deals.index"))


@bp.route("/<int:deal_id>/stage", methods=["POST"])
def update_stage(deal_id):
    stage = (request.get_json(silent=True) or request.form).get("stage")
    if stage not in STAGES:
        return jsonify({"ok": False, "error": "invalid stage"}), 400

    db = get_db()
    closed_at = date.today().isoformat() if stage in ("WON", "LOST") else None
    db.execute("UPDATE deals SET stage = ?, closed_at = ? WHERE id = ?", (stage, closed_at, deal_id))
    db.commit()
    return jsonify({"ok": True})
