# Orbit CRM

A detailed CRM for tracking contacts, companies, deals, and tasks — runs entirely on your own machine, no accounts, no cloud services, no build step. Optionally connects to **WhatsApp Business** and **Facebook Messenger** so inbound leads from those channels land straight in your Inbox.

## Features

- **Contacts & Companies** — full records with notes, linked company/contact relationships, and search
- **Deals pipeline** — drag-and-drop Kanban board across Lead → Qualified → Proposal → Negotiation → Won/Lost, with pipeline value per stage
- **Tasks & activities** — to-dos, calls, emails, meetings, and notes logged on a timeline against any contact, company, or deal
- **Inbox** — WhatsApp and Messenger conversations in one place: incoming messages auto-create or match a contact, and you can reply from inside the CRM
- **Dashboard** — key metrics, a pipeline-by-stage chart, upcoming tasks, and a recent activity feed
- **Global search** across contacts, companies, and deals

## Tech stack

Plain and dependency-light on purpose:

- [Flask](https://flask.palletsprojects.com) (Python web framework)
- SQLite — a single file database (`instance/crm.db`), no server to install or configure
- Server-rendered HTML templates (Jinja2) + plain CSS — no Node.js, no npm, no build step
- A little vanilla JavaScript for the drag-and-drop Kanban board — no frontend framework or CDN
- `requests` to call the WhatsApp/Messenger APIs, `python-dotenv` to load `.env`

## Running it locally

You need Python 3.9+ installed. Then, from this folder:

```bash
# 1. Create a virtual environment (keeps dependencies isolated)
python3 -m venv .venv

# 2. Activate it
source .venv/bin/activate        # macOS/Linux
.venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Optional) load sample data — companies, contacts, and deals to explore
python seed.py

# 5. Run it
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

No database server, no login required. The database is created automatically on first run at `instance/crm.db`, and existing databases are upgraded automatically too (e.g. after pulling an update that adds new fields).

To stop the server, press `Ctrl+C` in the terminal. To run it again later, just repeat step 5 (re-activate the virtual environment first if you opened a new terminal: `source .venv/bin/activate`).

### Starting over

If you want a clean slate (delete all data), stop the server and delete the database file:

```bash
rm instance/crm.db
```

It will be recreated empty the next time you run `python app.py`.

---

## Connecting WhatsApp Business & Facebook Messenger

Skip this whole section if you just want the CRM itself — everything above works with zero configuration. This part is only for wiring up the Inbox.

### The one thing to understand first

Meta (WhatsApp/Messenger) delivers messages by calling **your** server — it doesn't let you poll for them. That means your CRM needs a public HTTPS URL, even though it's running on your own computer. **[ngrok](https://ngrok.com/download)** solves this: it opens a tunnel from a public URL to `localhost:5000` on your machine.

The trade-off: your computer and `python app.py` (and ngrok) need to be **running and online** to receive messages. If your laptop is asleep or ngrok isn't running, incoming messages queue up on Meta's side for a while and get delivered once you're back online, but for anything beyond casual/testing use, you'll eventually want this running on an always-on machine instead of your laptop — the code doesn't change, only where you run it.

### 1. Install ngrok

Download from [ngrok.com/download](https://ngrok.com/download), then sign up for a free account and connect it (one-time):

```bash
ngrok config add-authtoken <your-token-from-the-ngrok-dashboard>
```

### 2. Create a Meta Developer App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App** → choose **Business** as the type.
2. Once created, note the **App Secret**: App Dashboard → **App Settings → Basic** → click "Show" next to App Secret. You'll put this in `.env` as `META_APP_SECRET`.

### 3. Set up WhatsApp

1. In your app's dashboard, find **WhatsApp** in the left sidebar and click **Set up**.
2. Under **API Setup** you'll see a test phone number already provisioned, plus:
   - A **temporary access token** (valid ~24h — fine for testing; see the note below for a permanent one)
   - A **Phone number ID**
3. Copy both into `.env` as `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
4. In `.env`, make up any random string for `WHATSAPP_VERIFY_TOKEN` (e.g. `orbit-whatsapp-verify-8k2j`) — you'll enter this exact value in the Meta dashboard in step 5.
5. **Get a permanent token** (recommended once you're past initial testing): create a System User under **Business Settings → Users → System Users**, generate a token for it with `whatsapp_business_messaging` permission, and use that instead — it won't expire every 24 hours.

### 4. Set up Messenger

1. In your app's dashboard, find **Messenger** → **Set up**.
2. Under **Access Tokens**, connect a Facebook Page you manage and generate a **Page Access Token**. Copy it into `.env` as `MESSENGER_PAGE_TOKEN`.
3. In `.env`, make up a random string for `MESSENGER_VERIFY_TOKEN` too.

### 5. Start the app and ngrok together

In one terminal:

```bash
python app.py
```

In a second terminal:

```bash
ngrok http 5000
```

ngrok prints a **Forwarding** URL that looks like `https://a1b2-3c4d.ngrok-free.app`. That's your public URL for as long as this ngrok session stays open — it changes every time you restart ngrok (unless you're on a paid ngrok plan with a reserved domain), so you'll repeat step 6 below whenever that happens.

### 6. Point Meta's webhooks at your ngrok URL

**WhatsApp:** App Dashboard → **WhatsApp → Configuration** → Webhook → **Edit**:
- Callback URL: `https://<your-ngrok-domain>/webhooks/whatsapp`
- Verify token: the `WHATSAPP_VERIFY_TOKEN` value you put in `.env`
- Click **Verify and save**, then subscribe to the **messages** field.

**Messenger:** App Dashboard → **Messenger → Settings** → Webhooks → **Add callback URL**:
- Callback URL: `https://<your-ngrok-domain>/webhooks/messenger`
- Verify token: the `MESSENGER_VERIFY_TOKEN` value
- Subscribe your Page to the app, and subscribe to the **messages** field.

If verification fails, double check `python app.py` and `ngrok` are both still running, and that the verify token matches exactly.

### 7. Test it

Send a WhatsApp message to your test number, or a Messenger message to your Page, from a different phone/account. It should appear in **Inbox** in the CRM within a couple seconds, with a new contact auto-created if it's someone new. Reply from the Inbox thread to send a message back.

### A few real-world limits (Meta's rules, not this app's)

- **24-hour window:** you can only send freeform replies within 24 hours of the customer's last message. Outside that window, WhatsApp requires a pre-approved message template (Messenger has similar restrictions with some exceptions) — this app doesn't implement template messages, so a reply attempted outside the window will show an error instead of silently failing.
- **WhatsApp test numbers** can only message a short allow-list of phone numbers until your app passes Meta's App Review / business verification for production access.
- **Messenger profile names**: fetching a sender's real name requires the `pages_messaging` permission with app review approval in production; until then (or if it fails) new contacts are created as "Messenger Lead" and you can rename them.

### Linking an existing contact manually

If auto-matching doesn't find the right contact (e.g. they messaged from a different number than the one you have on file), open the contact's **Edit** page and fill in their **WhatsApp number** or **Messenger PSID** yourself — future messages from that identifier will then match automatically.

## Project structure

```
app.py                       Entry point — run this to start the app
requirements.txt             Python dependencies (Flask, requests, python-dotenv)
seed.py                      Optional script to load sample data
.env.example                 Copy to .env to configure WhatsApp/Messenger
crm/
  __init__.py                Flask app factory
  db.py                      SQLite connection, auto-setup, and auto-migration
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
instance/                    Created automatically — holds crm.db (not committed to git)
```

## Notes

- Single user, no login — this is meant to run on your own computer for your own use.
- All data lives in `instance/crm.db`. Back it up like any file (copy it, put it in Dropbox, etc.) if you want to keep it safe.
- The dev server Flask prints a warning about not being a "production" server — that's expected and totally fine for local personal use.
- WhatsApp/Messenger credentials live only in your local `.env` file, which is git-ignored — they're never committed.
