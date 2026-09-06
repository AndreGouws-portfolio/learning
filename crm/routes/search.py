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
            "SELECT * FROM contacts WHERE first_name ILIKE %s OR last_name ILIKE %s OR email ILIKE %s LIMIT 20",
            (like, like, like),
        ).fetchall()
        companies = db.execute(
            "SELECT * FROM companies WHERE name ILIKE %s LIMIT 20", (like,)
        ).fetchall()
        deals = db.execute(
            "SELECT * FROM deals WHERE title ILIKE %s LIMIT 20", (like,)
        ).fetchall()

    return render_template(
        "search.html", q=q, contacts=contacts, companies=companies, deals=deals,
        total=len(contacts) + len(companies) + len(deals),
    )
