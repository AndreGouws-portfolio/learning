# Orbit CRM

A detailed CRM for tracking contacts, companies, deals, and tasks. Runs locally on your own machine or deployed to a free host (e.g. [Render](https://render.com)) — data lives in a free [Neon](https://neon.tech) Postgres database either way, so it's never lost on a redeploy or restart. Optionally connects to **WhatsApp Business** and **Facebook Messenger** so inbound leads from those channels land straight in your Inbox (note: Meta requires business verification for production use — see the section below before investing time in that part).

## Features

- **Contacts & Companies** — full records with notes, linked company/contact relationships, and search
- **Deals pipeline** — drag-and-drop Kanban board across Lead → Qualified → Proposal → Negotiation → Won/Lost, with pipeline value per stage
- **Tasks & activities** — to-dos, calls, emails, meetings, and notes logged on a timeline against any contact, company, or deal
- **Inbox** — WhatsApp and Messenger conversations in one place: incoming messages auto-create or match a contact, and you can reply from inside the CRM
- **Dashboard** — key metrics, a pipeline-by-stage chart, upcoming tasks, and a recent activity feed
- **Global search** across contacts, companies, and deals

## Tech stack

- [Flask](https://flask.palletsprojects.com) (Python web framework)
- **Postgres** via [Neon](https://neon.tech) (free tier) — a real database that survives restarts and redeploys, unlike a local file
- Server-rendered HTML templates (Jinja2) + plain CSS — no Node.js, no npm, no build step
- A little vanilla JavaScript for the drag-and-drop Kanban board — no frontend framework or CDN
- `psycopg` to talk to Postgres, `requests` for the WhatsApp/Messenger APIs, `python-dotenv` to load `.env`, `gunicorn` to serve it in production

## 1. Set up your database (Neon — free)

The app needs a Postgres connection string before it will start, whether you run it locally or deploy it.

1. Sign up free at [neon.tech](https://neon.tech) (no card required).
2. Create a project (any name, any region).
3. On the project dashboard, copy the **connection string** — looks like:
   ```
   postgresql://user:password@ep-xxxx.aws.neon.tech/neondb?sslmode=require
   ```
4. You'll use this same string everywhere below as `DATABASE_URL` — locally in `.env`, and later on Render.

Tables are created automatically the first time the app starts (and re-checked, harmlessly, on every start after that) — no separate migration step to run.

## 2. Running it locally

You need Python 3.9+ installed. Then, from this folder:

```bash
# 1. Create a virtual environment (keeps dependencies isolated)
python3 -m venv .venv

# 2. Activate it
source .venv/bin/activate        # macOS/Linux
.venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure your database connection
cp .env.example .env
# then open .env and paste your Neon connection string into DATABASE_URL

# 5. (Optional) load sample data — companies, contacts, and deals to explore
python seed.py

# 6. Run it
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

To stop the server, press `Ctrl+C` in the terminal.

### Desktop mode (always-on-top panel)

Instead of opening it in a browser tab, you can run it as a native always-on-top window docked to the right edge of your screen — one third of the screen wide, full height, pinned above every other window so new leads are always visible while you work:

```bash
python desktop.py
```

- **Maximize** the window and it un-pins (behaves like a normal full-screen app).
- **Restore** it back down and it re-pins itself on top automatically.
- It uses the same `DATABASE_URL`, so it shows the exact same data as your deployed instance (if you have one) — not a separate local copy.
- **Windows only** for the screen-docking math (it reads your screen's work area, i.e. excluding the taskbar). On macOS/Linux it'll still open always-on-top, just centered with a default size.
- Needs the **Microsoft Edge WebView2 Runtime**, preinstalled on virtually all current Windows 10/11 machines. If `python desktop.py` fails to open a window, grab it from [developer.microsoft.com/microsoft-edge/webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) and try again.

### Starting over

To wipe all data, go to your Neon project's **SQL Editor** and run:
```sql
DROP TABLE IF EXISTS messages, activities, deals, contacts, companies CASCADE;
```
Tables are recreated empty the next time the app starts.

## 3. Deploying it (Render — free)

1. Push this repo to your own GitHub account (or use it as-is if already there).
2. Sign up at [render.com](https://render.com) → **New +** → **Web Service** → connect the repo.
3. Settings:

   | Field | Value |
   |---|---|
   | Runtime | Python 3 |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `gunicorn app:app` |
   | Instance Type | Free |

4. In the **Environment** tab, add:
   ```
   DATABASE_URL       (your Neon connection string)
   SECRET_KEY         (any random string)
   ```
5. Deploy. Render gives you a permanent URL like `https://your-app.onrender.com`.

**Free tier notes:** the service sleeps after 15 minutes idle (first request after that takes ~30-60s to wake up), and the filesystem is wiped on every redeploy — but since all data now lives in Neon, not on Render's disk, none of that affects your data.

---

## Connecting WhatsApp Business & Facebook Messenger (optional)

Skip this whole section if you just want the CRM itself — everything above works without it. This part wires up the Inbox to receive real messages.

**Before you start:** to send/receive real (non-test) messages in production, Meta requires **business verification** — documents proving your business exists (registration papers, etc.). If you're a sole proprietor without that paperwork, you can still fully build and test this with a WhatsApp **test number** (no verification needed), but you won't be able to message arbitrary real customers until you complete verification. Worth knowing before investing time here.

### The one thing to understand first

Meta delivers messages by calling **your server** — it doesn't let you poll for them. That means your CRM needs a public HTTPS URL. If you've deployed to Render (section above), you already have one — use `https://your-app.onrender.com` directly, no extra tunnel needed. If you're only running locally, you'd need something like [ngrok](https://ngrok.com/download) to expose `localhost:5000` temporarily — but a real deployment is the better long-term answer since it doesn't require your laptop to stay on.

### 1. Create a Meta Developer App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App** → choose **Business** as the type.
2. Note the **App Secret**: App Dashboard → **App Settings → Basic** → click "Show" next to App Secret. This goes in `.env`/Render's env vars as `META_APP_SECRET`.

### 2. Set up WhatsApp

1. In your app's dashboard, find **WhatsApp** → **Set up**.
2. Under **API Setup**: copy the **temporary access token** (`WHATSAPP_TOKEN`, valid ~24h — fine for testing) and the **Phone number ID** (`WHATSAPP_PHONE_NUMBER_ID`, a numeric ID — not your phone number itself).
3. Make up any random string for `WHATSAPP_VERIFY_TOKEN` — you'll enter the same value in Meta's dashboard next.
4. For a token that doesn't expire every 24h: **Business Settings → Users → System Users** → create one → generate a token with `whatsapp_business_messaging` permission.

### 3. Set up Messenger

1. **Messenger** → **Set up** → **Access Tokens** → connect a Facebook Page → generate a **Page Access Token** (`MESSENGER_PAGE_TOKEN`).
2. Make up a random string for `MESSENGER_VERIFY_TOKEN`.

### 4. Add the env vars

Wherever you're running the app (local `.env`, or Render's Environment tab):
```
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
MESSENGER_PAGE_TOKEN=...
MESSENGER_VERIFY_TOKEN=...
META_APP_SECRET=...
```

### 5. Point Meta's webhooks at your app

**WhatsApp:** App Dashboard → **WhatsApp → Configuration** → Webhook → **Edit**:
- Callback URL: `https://<your-app-url>/webhooks/whatsapp`
- Verify token: your `WHATSAPP_VERIFY_TOKEN` value
- **Verify and save**, then subscribe to the **messages** field.

**Messenger:** App Dashboard → **Messenger → Settings** → Webhooks → **Add callback URL**:
- Callback URL: `https://<your-app-url>/webhooks/messenger`
- Verify token: your `MESSENGER_VERIFY_TOKEN` value
- Subscribe your Page, then subscribe to the **messages** field.

If verification fails on a Render deployment specifically, it may be a cold-start timeout (the free tier was asleep) — just click **Verify and save** again.

### 6. Test it

Send a WhatsApp message to your test number, or a Messenger message to your Page. It should appear in **Inbox** within a couple seconds, auto-creating a contact if new. Reply from the thread to send one back.

### A few real-world limits (Meta's rules, not this app's)

- **24-hour window:** freeform replies only work within 24 hours of the customer's last message; outside that, WhatsApp requires a pre-approved template (not implemented here) — a reply attempted outside the window shows an error rather than failing silently.
- **WhatsApp test numbers** can only message a short allow-list of phone numbers until business verification is complete.
- **Messenger profile names** require extra permission/approval to fetch automatically; until then, new contacts are created as "Messenger Lead" — rename them manually.

### Linking an existing contact manually

If auto-matching misses (e.g. a different number than what's on file), open the contact's **Edit** page and fill in their **WhatsApp number** or **Messenger PSID** yourself.

## Project structure

```
app.py                       Entry point — plain browser mode
desktop.py                   Entry point — always-on-top native window mode
requirements.txt             Python dependencies
seed.py                      Optional script to load sample data
.env.example                 Copy to .env and fill in DATABASE_URL (+ WhatsApp/Messenger if using)
crm/
  __init__.py                Flask app factory
  db.py                      Postgres connection (via DATABASE_URL) + auto schema setup
  schema.sql                 Table definitions
  util.py                    Small helpers
  integrations/
    whatsapp.py               WhatsApp Cloud API: send, verify, parse webhooks
    messenger.py               Messenger Platform: send, verify, parse webhooks
  routes/                    One file per feature area
    dashboard.py
    contacts.py
    companies.py
    deals.py
    activities.py            Tasks + activity timeline (shared across contacts/companies/deals)
    search.py
    webhooks.py              Receives inbound WhatsApp/Messenger messages
    inbox.py                 Conversation list, thread view, sending replies
  templates/                 Jinja2 HTML templates, organized to match routes/
  static/
    style.css                All styling (no framework/CDN)
    app.js                   Dropdown menus, delete confirmations
    kanban.js                Drag-and-drop for the deals board
```

## Notes

- Single user, no login — meant for your own use, whether run locally or deployed.
- All data lives in your Neon Postgres database — the same data shows up whether you access it via `python app.py`, `python desktop.py`, or your Render deployment, since they all point at the same `DATABASE_URL`.
- Credentials (`DATABASE_URL`, WhatsApp/Messenger tokens) live in `.env` locally (git-ignored, never committed) or in Render's Environment tab for the deployed copy.
