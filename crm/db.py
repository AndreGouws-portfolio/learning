import sqlite3
from pathlib import Path

import click
from flask import current_app, g

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# Columns added after the initial release. New installs get them from
# schema.sql directly; existing databases get them patched in here so
# `python app.py` keeps working with no manual migration step.
_NEW_COLUMNS = {
    "contacts": {
        "whatsapp_number": "TEXT",
        "messenger_psid": "TEXT",
    },
}


def _migrate(db):
    for table, columns in _NEW_COLUMNS.items():
        existing = {row["name"] for row in db.execute(f"PRAGMA table_info({table})")}
        for name, coltype in columns.items():
            if name not in existing:
                db.execute(f"ALTER TABLE {table} ADD COLUMN {name} {coltype}")


def init_db():
    db = get_db()
    tables_sql, _, indexes_sql = open(SCHEMA_PATH).read().partition("-- INDEXES")
    db.executescript(tables_sql)
    _migrate(db)
    db.executescript(indexes_sql)
    db.commit()


@click.command("init-db")
def init_db_command():
    """Create the database tables if they don't already exist."""
    init_db()
    click.echo("Database initialized.")


def init_app(app):
    Path(app.config["DATABASE"]).parent.mkdir(parents=True, exist_ok=True)
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
    with app.app_context():
        init_db()
