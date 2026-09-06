import os

from dotenv import load_dotenv
from flask import Flask

load_dotenv()


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev"),
    )

    if test_config:
        app.config.update(test_config)

    from . import db

    db.init_app(app)

    from .routes import dashboard, contacts, companies, deals, activities, calendar, search, webhooks, inbox

    app.register_blueprint(dashboard.bp)
    app.register_blueprint(contacts.bp)
    app.register_blueprint(companies.bp)
    app.register_blueprint(deals.bp)
    app.register_blueprint(activities.bp)
    app.register_blueprint(calendar.bp)
    app.register_blueprint(search.bp)
    app.register_blueprint(webhooks.bp)
    app.register_blueprint(inbox.bp)

    from . import filters

    filters.init_app(app)

    @app.context_processor
    def inject_unread_count():
        from .db import get_db

        db = get_db()
        n = db.execute(
            "SELECT COUNT(*) AS n FROM messages WHERE direction = 'IN' AND read_at IS NULL"
        ).fetchone()["n"]
        return {"unread_message_count": n}

    return app
