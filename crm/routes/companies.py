from flask import Blueprint, flash, redirect, render_template, request, url_for

from ..db import get_db

bp = Blueprint("companies", __name__, url_prefix="/companies")


@bp.route("/")
def index():
    db = get_db()
    q = request.args.get("q", "").strip()
    if q:
        rows = db.execute(
            "SELECT co.*, "
            "(SELECT COUNT(*) FROM contacts WHERE company_id = co.id) AS contact_count, "
            "(SELECT COUNT(*) FROM deals WHERE company_id = co.id) AS deal_count "
            "FROM companies co WHERE co.name ILIKE %s ORDER BY co.name",
            (f"%{q}%",),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT co.*, "
            "(SELECT COUNT(*) FROM contacts WHERE company_id = co.id) AS contact_count, "
            "(SELECT COUNT(*) FROM deals WHERE company_id = co.id) AS deal_count "
            "FROM companies co ORDER BY co.name"
        ).fetchall()
    return render_template("companies/list.html", companies=rows, q=q)


@bp.route("/new", methods=["GET", "POST"])
def new():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        if not name:
            flash("Company name is required.")
            return render_template("companies/form.html", company=request.form)

        db = get_db()
        cur = db.execute(
            "INSERT INTO companies (name, website, industry, phone, address, notes) "
            "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (
                name,
                request.form.get("website") or None,
                request.form.get("industry") or None,
                request.form.get("phone") or None,
                request.form.get("address") or None,
                request.form.get("notes") or None,
            ),
        )
        new_id = cur.fetchone()["id"]
        db.commit()
        return redirect(url_for("companies.detail", company_id=new_id))

    return render_template("companies/form.html", company=None)


@bp.route("/<int:company_id>")
def detail(company_id):
    db = get_db()
    company = db.execute("SELECT * FROM companies WHERE id = %s", (company_id,)).fetchone()
    if company is None:
        return render_template("404.html"), 404

    contacts = db.execute(
        "SELECT * FROM contacts WHERE company_id = %s ORDER BY last_name, first_name", (company_id,)
    ).fetchall()
    deals = db.execute(
        "SELECT * FROM deals WHERE company_id = %s ORDER BY created_at DESC", (company_id,)
    ).fetchall()
    activities = db.execute(
        "SELECT * FROM activities WHERE company_id = %s ORDER BY created_at DESC", (company_id,)
    ).fetchall()
    return render_template(
        "companies/detail.html", company=company, contacts=contacts, deals=deals, activities=activities
    )


@bp.route("/<int:company_id>/edit", methods=["GET", "POST"])
def edit(company_id):
    db = get_db()
    company = db.execute("SELECT * FROM companies WHERE id = %s", (company_id,)).fetchone()
    if company is None:
        return render_template("404.html"), 404
    company = dict(company)

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        if not name:
            flash("Company name is required.")
            return render_template("companies/form.html", company=request.form, company_id=company_id)

        db.execute(
            "UPDATE companies SET name=%s, website=%s, industry=%s, phone=%s, address=%s, notes=%s WHERE id=%s",
            (
                name,
                request.form.get("website") or None,
                request.form.get("industry") or None,
                request.form.get("phone") or None,
                request.form.get("address") or None,
                request.form.get("notes") or None,
                company_id,
            ),
        )
        db.commit()
        return redirect(url_for("companies.detail", company_id=company_id))

    return render_template("companies/form.html", company=company, company_id=company_id)


@bp.route("/<int:company_id>/delete", methods=["POST"])
def delete(company_id):
    db = get_db()
    db.execute("DELETE FROM companies WHERE id = %s", (company_id,))
    db.commit()
    return redirect(url_for("companies.index"))
