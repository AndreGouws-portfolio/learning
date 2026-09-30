import os
import secrets
from datetime import timedelta

from flask import Blueprint, current_app, flash, redirect, render_template, request, session, url_for

from .util import safe_next

bp = Blueprint("auth", __name__)


def _valid_login(username, password):
    return secrets.compare_digest(username, current_app.config["ADMIN_USERNAME"]) and secrets.compare_digest(
        password, current_app.config["ADMIN_PASSWORD"]
    )


@bp.route("/login", methods=["GET", "POST"])
def login():
    if session.get("logged_in"):
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if _valid_login(username, password):
            session.clear()
            session["logged_in"] = True
            session.permanent = True
            return redirect(safe_next(request.form.get("next"), url_for("dashboard.index")))
        flash("Incorrect username or password.")

    return render_template("login.html", next=request.args.get("next", ""))


@bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect(url_for("auth.login"))


def init_app(app):
    app.config.setdefault("ADMIN_USERNAME", os.environ.get("ADMIN_USERNAME"))
    app.config.setdefault("ADMIN_PASSWORD", os.environ.get("ADMIN_PASSWORD"))
    if not app.config["ADMIN_USERNAME"] or not app.config["ADMIN_PASSWORD"]:
        raise RuntimeError(
            "ADMIN_USERNAME / ADMIN_PASSWORD are not set. Add them to your .env file "
            "to control who can log in to the CRM - see .env.example."
        )

    app.permanent_session_lifetime = timedelta(days=30)
    app.register_blueprint(bp)

    @app.before_request
    def require_login():
        if request.endpoint is None:
            return None
        # Webhooks are called by Meta's servers, not a logged-in browser - they
        # authenticate separately via verify token / signature, not a session.
        if request.blueprint in ("auth", "webhooks"):
            return None
        if request.endpoint == "static":
            return None
        if session.get("logged_in"):
            return None
        next_url = request.full_path.rstrip("?")
        return redirect(url_for("auth.login", next=next_url))
