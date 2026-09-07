from datetime import date, timedelta

from flask import Blueprint, flash, redirect, render_template, request, url_for

from ..db import get_db
from ..util import safe_next

bp = Blueprint("invoices", __name__, url_prefix="/invoices")

# --- Your business details, shown on every invoice. Edit these to match your
# real details before sending an invoice to a client. ---
BUSINESS = {
    "name": "ColdStart Digital",
    "tagline": "Website Design, Development & Hosting for South African Businesses",
    "email": "[Add your email address]",  # TODO: replace with your real email
    "phone": "[Add your phone number]",  # TODO
    "address": "South Africa",  # TODO: add a full address if you want one shown
    "bank_name": "[Your bank]",  # TODO
    "account_name": "ColdStart Digital",
    "account_number": "[Your account number]",  # TODO
    "branch_code": "[Your branch code]",  # TODO
}

# Default itemized breakdown for ColdStart Digital's standard monthly package.
# Shown pre-filled on a new invoice - edit quantities/prices per client, or
# add/remove rows, before saving.
DEFAULT_ITEMS = [
    ("Website Design & Production", 1, 0),
    ("Web Hosting (Monthly)", 1, 440),
    ("Logo Creation", 1, 0),
    ("Revisions & Changes (6 per 6-month period)", 1, 0),
    ("Basic Price Changes", 1, 0),
    ("Unlimited Maintenance", 1, 0),
]


def _contacts(db):
    return db.execute("SELECT id, first_name, last_name, company_id FROM contacts ORDER BY last_name, first_name").fetchall()


def _companies(db):
    return db.execute("SELECT id, name FROM companies ORDER BY name").fetchall()


def _parse_items(form):
    items = []
    for desc, qty, price in zip(
        form.getlist("description"), form.getlist("quantity"), form.getlist("unit_price")
    ):
        desc = desc.strip()
        if not desc:
            continue
        try:
            qty_f = float(qty) if qty else 1
        except ValueError:
            qty_f = 1
        try:
            price_f = float(price) if price else 0
        except ValueError:
            price_f = 0
        items.append((desc, qty_f, price_f))
    return items


def _save_items(db, invoice_id, items):
    db.execute("DELETE FROM invoice_items WHERE invoice_id = %s", (invoice_id,))
    for position, (desc, qty, price) in enumerate(items):
        db.execute(
            "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, position) "
            "VALUES (%s, %s, %s, %s, %s)",
            (invoice_id, desc, qty, price, position),
        )


@bp.route("/")
def index():
    db = get_db()
    rows = db.execute(
        "SELECT i.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name, "
        "co.name AS company_name, COALESCE(SUM(ii.quantity * ii.unit_price), 0) AS total "
        "FROM invoices i "
        "LEFT JOIN contacts c ON c.id = i.contact_id "
        "LEFT JOIN companies co ON co.id = i.company_id "
        "LEFT JOIN invoice_items ii ON ii.invoice_id = i.id "
        "GROUP BY i.id, c.id, co.id "
        "ORDER BY i.created_at DESC"
    ).fetchall()
    return render_template("invoices/list.html", invoices=rows)


@bp.route("/new", methods=["GET", "POST"])
def new():
    db = get_db()

    if request.method == "POST":
        contact_id = request.form.get("contact_id") or None
        company_id = request.form.get("company_id") or None
        issue_date = request.form.get("issue_date") or date.today().isoformat()
        due_date = request.form.get("due_date") or None
        notes = request.form.get("notes") or None
        items = _parse_items(request.form)

        if not contact_id and not company_id:
            flash("Pick a contact or company to bill.")
            return render_template(
                "invoices/form.html",
                invoice=request.form,
                items=items or DEFAULT_ITEMS,
                contacts=_contacts(db),
                companies=_companies(db),
                business=BUSINESS,
            )

        cur = db.execute(
            "INSERT INTO invoices (contact_id, company_id, issue_date, due_date, notes) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (contact_id, company_id, issue_date, due_date, notes),
        )
        new_id = cur.fetchone()["id"]
        db.execute(
            "UPDATE invoices SET invoice_number = %s WHERE id = %s",
            (f"INV-{new_id:04d}", new_id),
        )
        _save_items(db, new_id, items)
        db.commit()
        return redirect(url_for("invoices.detail", invoice_id=new_id))

    contact_id = request.args.get("contact_id", type=int)
    company_id = request.args.get("company_id", type=int)
    prefill = {
        "contact_id": contact_id,
        "company_id": company_id,
        "issue_date": date.today().isoformat(),
        "due_date": (date.today() + timedelta(days=7)).isoformat(),
    }
    return render_template(
        "invoices/form.html",
        invoice=prefill,
        items=DEFAULT_ITEMS,
        contacts=_contacts(db),
        companies=_companies(db),
        business=BUSINESS,
    )


def _get_invoice(db, invoice_id):
    invoice = db.execute(
        "SELECT i.*, c.first_name AS contact_first_name, c.last_name AS contact_last_name, "
        "c.email AS contact_email, co.name AS company_name, co.address AS company_address "
        "FROM invoices i "
        "LEFT JOIN contacts c ON c.id = i.contact_id "
        "LEFT JOIN companies co ON co.id = i.company_id "
        "WHERE i.id = %s",
        (invoice_id,),
    ).fetchone()
    if invoice is None:
        return None, None
    items = db.execute(
        "SELECT * FROM invoice_items WHERE invoice_id = %s ORDER BY position", (invoice_id,)
    ).fetchall()
    return invoice, items


@bp.route("/<int:invoice_id>")
def detail(invoice_id):
    db = get_db()
    invoice, items = _get_invoice(db, invoice_id)
    if invoice is None:
        return render_template("404.html"), 404
    total = sum(i["quantity"] * i["unit_price"] for i in items)
    return render_template("invoices/detail.html", invoice=invoice, items=items, total=total, business=BUSINESS)


@bp.route("/<int:invoice_id>/edit", methods=["GET", "POST"])
def edit(invoice_id):
    db = get_db()
    invoice, items = _get_invoice(db, invoice_id)
    if invoice is None:
        return render_template("404.html"), 404

    if request.method == "POST":
        contact_id = request.form.get("contact_id") or None
        company_id = request.form.get("company_id") or None
        issue_date = request.form.get("issue_date") or invoice["issue_date"]
        due_date = request.form.get("due_date") or None
        notes = request.form.get("notes") or None
        new_items = _parse_items(request.form)

        db.execute(
            "UPDATE invoices SET contact_id=%s, company_id=%s, issue_date=%s, due_date=%s, notes=%s "
            "WHERE id=%s",
            (contact_id, company_id, issue_date, due_date, notes, invoice_id),
        )
        _save_items(db, invoice_id, new_items)
        db.commit()
        return redirect(url_for("invoices.detail", invoice_id=invoice_id))

    return render_template(
        "invoices/form.html",
        invoice=invoice,
        items=[(i["description"], i["quantity"], i["unit_price"]) for i in items],
        contacts=_contacts(db),
        companies=_companies(db),
        business=BUSINESS,
        invoice_id=invoice_id,
    )


@bp.route("/<int:invoice_id>/status", methods=["POST"])
def set_status(invoice_id):
    db = get_db()
    status = request.form.get("status")
    if status in ("DRAFT", "SENT", "PAID"):
        db.execute("UPDATE invoices SET status = %s WHERE id = %s", (status, invoice_id))
        db.commit()
    return redirect(safe_next(request.form.get("next"), url_for("invoices.detail", invoice_id=invoice_id)))


@bp.route("/<int:invoice_id>/delete", methods=["POST"])
def delete(invoice_id):
    db = get_db()
    db.execute("DELETE FROM invoices WHERE id = %s", (invoice_id,))
    db.commit()
    return redirect(url_for("invoices.index"))
