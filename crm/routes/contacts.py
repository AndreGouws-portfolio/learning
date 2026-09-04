import re

from flask import Blueprint, flash, redirect, render_template, request, url_for

from ..db import get_db

bp = Blueprint("contacts", __name__, url_prefix="/contacts")


def _digits_or_none(value):
    digits = re.sub(r"\D", "", value or "")
    return digits or None


def _companies(db):
    return db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()


@bp.route("/")
def index():
    db = get_db()
    q = request.args.get("q", "").strip()
    if q:
        like = f"%{q}%"
        rows = db.execute(
            "SELECT c.*, co.name AS company_name FROM contacts c "
            "LEFT JOIN companies co ON co.id = c.company_id "
            "WHERE c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? "
            "ORDER BY c.last_name, c.first_name",
            (like, like, like),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT c.*, co.name AS company_name FROM contacts c "
            "LEFT JOIN companies co ON co.id = c.company_id "
            "ORDER BY c.last_name, c.first_name"
        ).fetchall()
    return render_template("contacts/list.html", contacts=rows, q=q)


@bp.route("/new", methods=["GET", "POST"])
def new():
    db = get_db()
    if request.method == "POST":
        error = None
        first_name = request.form.get("first_name", "").strip()
        last_name = request.form.get("last_name", "").strip()
        if not first_name or not last_name:
            error = "First and last name are required."

        if error:
            flash(error)
            return render_template("contacts/form.html", contact=request.form, companies=_companies(db))

        cur = db.execute(
            "INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, notes, "
            "whatsapp_number, messenger_psid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                first_name,
                last_name,
                request.form.get("email") or None,
                request.form.get("phone") or None,
                request.form.get("title") or None,
                request.form.get("company_id") or None,
                request.form.get("notes") or None,
                _digits_or_none(request.form.get("whatsapp_number")),
                request.form.get("messenger_psid", "").strip() or None,
            ),
        )
        db.commit()
        return redirect(url_for("contacts.detail", contact_id=cur.lastrowid))

    return render_template("contacts/form.html", contact=None, companies=_companies(db))


@bp.route("/<int:contact_id>")
def detail(contact_id):
    db = get_db()
    contact = db.execute(
        "SELECT c.*, co.name AS company_name FROM contacts c "
        "LEFT JOIN companies co ON co.id = c.company_id WHERE c.id = ?",
        (contact_id,),
    ).fetchone()
    if contact is None:
        return render_template("404.html"), 404

    deals = db.execute(
        "SELECT * FROM deals WHERE contact_id = ? ORDER BY created_at DESC", (contact_id,)
    ).fetchall()
    activities = db.execute(
        "SELECT * FROM activities WHERE contact_id = ? ORDER BY created_at DESC", (contact_id,)
    ).fetchall()
    return render_template("contacts/detail.html", contact=contact, deals=deals, activities=activities)


@bp.route("/<int:contact_id>/edit", methods=["GET", "POST"])
def edit(contact_id):
    db = get_db()
    contact = db.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
    if contact is None:
        return render_template("404.html"), 404
    contact = dict(contact)

    if request.method == "POST":
        error = None
        first_name = request.form.get("first_name", "").strip()
        last_name = request.form.get("last_name", "").strip()
        if not first_name or not last_name:
            error = "First and last name are required."

        if error:
            flash(error)
            return render_template("contacts/form.html", contact=request.form, companies=_companies(db), contact_id=contact_id)

        db.execute(
            "UPDATE contacts SET first_name=?, last_name=?, email=?, phone=?, title=?, company_id=?, "
            "notes=?, whatsapp_number=?, messenger_psid=? WHERE id=?",
            (
                first_name,
                last_name,
                request.form.get("email") or None,
                request.form.get("phone") or None,
                request.form.get("title") or None,
                request.form.get("company_id") or None,
                request.form.get("notes") or None,
                _digits_or_none(request.form.get("whatsapp_number")),
                request.form.get("messenger_psid", "").strip() or None,
                contact_id,
            ),
        )
        db.commit()
        return redirect(url_for("contacts.detail", contact_id=contact_id))

    return render_template("contacts/form.html", contact=contact, companies=_companies(db), contact_id=contact_id)


@bp.route("/<int:contact_id>/delete", methods=["POST"])
def delete(contact_id):
    db = get_db()
    db.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
    db.commit()
    return redirect(url_for("contacts.index"))
