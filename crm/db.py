import os
from pathlib import Path

import click
import psycopg
from psycopg.rows import dict_row
from flask import current_app, g

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def get_db():
    if "db" not in g:
        database_url = current_app.config["DATABASE_URL"]
        g.db = psycopg.connect(database_url, row_factory=dict_row)
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    with open(SCHEMA_PATH) as f:
        db.execute(f.read())
    db.commit()


@click.command("init-db")
def init_db_command():
    """Create the database tables if they don't already exist."""
    init_db()
    click.echo("Database initialized.")


def init_app(app):
    app.config.setdefault("DATABASE_URL", os.environ.get("DATABASE_URL"))
    if not app.config["DATABASE_URL"]:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it to your .env file (a Neon Postgres "
            "connection string) - see .env.example."
        )
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
    with app.app_context():
        init_db()
