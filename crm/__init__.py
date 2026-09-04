import os

from flask import Flask


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev"),
        DATABASE=os.path.join(app.instance_path, "crm.db"),
    )

    if test_config:
        app.config.update(test_config)

    from . import db

    db.init_app(app)

    from .routes import dashboard, contacts, companies, deals, activities, search

    app.register_blueprint(dashboard.bp)
    app.register_blueprint(contacts.bp)
    app.register_blueprint(companies.bp)
    app.register_blueprint(deals.bp)
    app.register_blueprint(activities.bp)
    app.register_blueprint(search.bp)

    from . import filters

    filters.init_app(app)

    return app
