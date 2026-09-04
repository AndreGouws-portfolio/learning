# Orbit CRM

A detailed CRM for tracking contacts, companies, deals, and tasks — runs entirely on your own machine, no accounts, no cloud services, no build step.

## Features

- **Contacts & Companies** — full records with notes, linked company/contact relationships, and search
- **Deals pipeline** — drag-and-drop Kanban board across Lead → Qualified → Proposal → Negotiation → Won/Lost, with pipeline value per stage
- **Tasks & activities** — to-dos, calls, emails, meetings, and notes logged on a timeline against any contact, company, or deal
- **Dashboard** — key metrics, a pipeline-by-stage chart, upcoming tasks, and a recent activity feed
- **Global search** across contacts, companies, and deals

## Tech stack

Plain and dependency-light on purpose:

- [Flask](https://flask.palletsprojects.com) (Python web framework) — the *only* thing you need to `pip install`
- SQLite — a single file database (`instance/crm.db`), no server to install or configure
- Server-rendered HTML templates (Jinja2) + plain CSS — no Node.js, no npm, no build step
- A little vanilla JavaScript for the drag-and-drop Kanban board — no frontend framework or CDN

## Running it locally

You need Python 3.9+ installed. Then, from this folder:

```bash
# 1. Create a virtual environment (keeps dependencies isolated)
python3 -m venv .venv

# 2. Activate it
source .venv/bin/activate        # macOS/Linux
.venv\Scripts\activate           # Windows

# 3. Install the one dependency
pip install -r requirements.txt

# 4. (Optional) load sample data — companies, contacts, and deals to explore
python seed.py

# 5. Run it
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

That's it — no database server, no environment variables, no login required. The database is created automatically on first run at `instance/crm.db`.

To stop the server, press `Ctrl+C` in the terminal. To run it again later, just repeat step 5 (re-activate the virtual environment first if you opened a new terminal: `source .venv/bin/activate`).

### Starting over

If you want a clean slate (delete all data), stop the server and delete the database file:

```bash
rm instance/crm.db
```

It will be recreated empty the next time you run `python app.py`.

## Project structure

```
app.py                       Entry point — run this to start the app
requirements.txt             Python dependencies (just Flask)
seed.py                      Optional script to load sample data
crm/
  __init__.py                Flask app factory
  db.py                      SQLite connection + auto-setup
  schema.sql                 Table definitions (companies, contacts, deals, activities)
  util.py                    Small helpers
  routes/                    One file per feature area
    dashboard.py
    contacts.py
    companies.py
    deals.py
    activities.py            Tasks + activity timeline (shared across contacts/companies/deals)
    search.py
  templates/                 Jinja2 HTML templates, organized to match routes/
  static/
    style.css                All styling (no framework/CDN)
    app.js                   Dropdown menus, delete confirmations
    kanban.js                Drag-and-drop for the deals board
instance/                    Created automatically — holds crm.db (not committed to git)
```

## Notes

- Single user, no login — this is meant to run on your own computer for your own use.
- All data lives in `instance/crm.db`. Back it up like any file (copy it, put it in Dropbox, etc.) if you want to keep it safe.
- The dev server Flask prints a warning about not being a "production" server — that's expected and totally fine for local personal use.
