"""Populate the local database with sample data.

Usage:
    python seed.py
"""

from datetime import date, timedelta

from crm import create_app
from crm.db import get_db, init_db


def run():
    app = create_app()
    with app.app_context():
        db = get_db()
        init_db()

        existing = db.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
        if existing:
            print("Database already has data — skipping seed. Delete instance/crm.db to start fresh.")
            return

        acme_id = db.execute(
            "INSERT INTO companies (name, website, industry, phone, address) "
            "VALUES (?, ?, ?, ?, ?)",
            ("Acme Corporation", "https://acme.example.com", "Manufacturing",
             "+1 555 0100", "123 Industrial Way, Springfield"),
        ).lastrowid

        globex_id = db.execute(
            "INSERT INTO companies (name, website, industry, phone) VALUES (?, ?, ?, ?)",
            ("Globex Inc.", "https://globex.example.com", "Software", "+1 555 0199"),
        ).lastrowid

        jane_id = db.execute(
            "INSERT INTO contacts (first_name, last_name, email, phone, title, company_id) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("Jane", "Doe", "jane.doe@acme.example.com", "+1 555 0111",
             "VP of Operations", acme_id),
        ).lastrowid

        mark_id = db.execute(
            "INSERT INTO contacts (first_name, last_name, email, phone, title, company_id) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("Mark", "Chen", "mark.chen@globex.example.com", "+1 555 0122",
             "CTO", globex_id),
        ).lastrowid

        deal1_id = db.execute(
            "INSERT INTO deals (title, value, stage, company_id, contact_id, expected_close_date) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("Acme — Annual Platform License", 48000, "PROPOSAL", acme_id, jane_id,
             (date.today() + timedelta(days=21)).isoformat()),
        ).lastrowid

        deal2_id = db.execute(
            "INSERT INTO deals (title, value, stage, company_id, contact_id, expected_close_date) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("Globex — Implementation Services", 15000, "QUALIFIED", globex_id, mark_id,
             (date.today() + timedelta(days=45)).isoformat()),
        ).lastrowid

        db.execute(
            "INSERT INTO deals (title, value, stage, company_id, closed_at) VALUES (?, ?, ?, ?, ?)",
            ("Acme — Support Renewal", 9000, "WON", acme_id, date.today().isoformat()),
        )

        db.execute(
            "INSERT INTO activities (type, title, due_date, contact_id, deal_id, company_id) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("TASK", "Send updated proposal to Jane",
             (date.today() + timedelta(days=2)).isoformat(), jane_id, deal1_id, acme_id),
        )
        db.execute(
            "INSERT INTO activities (type, title, notes, completed_at, contact_id, deal_id, company_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("CALL", "Discovery call with Mark", "Discussed integration timeline and rollout plan.",
             date.today().isoformat(), mark_id, deal2_id, globex_id),
        )
        db.execute(
            "INSERT INTO activities (type, title, due_date, deal_id, company_id) VALUES (?, ?, ?, ?, ?)",
            ("TASK", "Prepare implementation timeline",
             (date.today() - timedelta(days=1)).isoformat(), deal2_id, globex_id),
        )
        db.execute(
            "INSERT INTO activities (type, title, notes, completed_at, company_id) VALUES (?, ?, ?, ?, ?)",
            ("NOTE", "Kickoff notes", "Acme wants onboarding to start within 30 days of signing.",
             date.today().isoformat(), acme_id),
        )

        db.commit()
        print("Seeded 2 companies, 2 contacts, 3 deals, 4 activities.")


if __name__ == "__main__":
    run()
