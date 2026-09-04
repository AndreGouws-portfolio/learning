from flask import Blueprint, render_template, request

from ..db import get_db

bp = Blueprint("search", __name__, url_prefix="/search")


@bp.route("/")
def index():
    q = request.args.get("q", "").strip()
    contacts = companies = deals = []

    if q:
        db = get_db()
        like = f"%{q}%"
        contacts = db.execute(
            "SELECT * FROM contacts WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? LIMIT 20",
            (like, like, like),
        ).fetchall()
        companies = db.execute(
            "SELECT * FROM companies WHERE name LIKE ? LIMIT 20", (like,)
        ).fetchall()
        deals = db.execute(
            "SELECT * FROM deals WHERE title LIKE ? LIMIT 20", (like,)
        ).fetchall()

    return render_template(
        "search.html", q=q, contacts=contacts, companies=companies, deals=deals,
        total=len(contacts) + len(companies) + len(deals),
    )
