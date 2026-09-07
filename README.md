# Subscription Tracker

A small internal tool for tracking client subscriptions: who owes what, whether they've paid
this month, and sending them a payment reminder email when they haven't.

Workflow it's built around: you forward/copy client details from email into the app once, then
each month you check the dashboard, mark clients as paid as payments come in, and send reminders
to anyone still overdue.

## Features

- Add clients with their billing amount, currency, and due day of the month
- Dashboard shows every client's status for the current billing period: **Paid**, **Overdue**,
  or **Upcoming**
- Mark a client as paid for the current period with one click
- Send a payment reminder email to one overdue client, or to all overdue clients at once
- Payment and reminder history per client
- Single shared password protects the whole app (it holds client emails, so don't leave it open)

## Tech stack

- Next.js (App Router, Server Actions) + TypeScript + Tailwind CSS
- Prisma + SQLite for storage
- Nodemailer for outgoing email

## Getting started

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- `ADMIN_PASSWORD` — the password you'll use to log in. Pick something strong.
- `ADMIN_SESSION_SECRET` — a random string used to sign the login session cookie.
  Generate one with `openssl rand -hex 32`.
- `SMTP_*` / `EMAIL_FROM` — your outgoing email provider (see below). You can leave these
  blank to start; the app still works, and "Send reminder" will just show an error instead
  of crashing.

Then create the database and start the app:

```bash
npx prisma migrate deploy
npm run dev
```

Visit http://localhost:3000, log in with `ADMIN_PASSWORD`, and add your first client.

## Setting up email (Gmail example)

Reminders are sent over SMTP, so any provider works (Gmail, Resend, Postmark, SendGrid SMTP,
your own mail server, etc). To use a Gmail account:

1. Turn on 2-Step Verification on the Google account: https://myaccount.google.com/security
2. Create an **App Password**: https://myaccount.google.com/apppasswords (choose "Mail" as the app)
3. Set in `.env`:
   ```
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="you@gmail.com"
   SMTP_PASS="the 16-character app password"
   EMAIL_FROM="you@gmail.com"
   ```

Reminder emails are sent from the client's stored email address and amount — edit the copy in
`src/lib/mailer.ts` if you want to change the wording.

## How payment status is calculated

Each client has a `dueDay` (1–28, to avoid short-month edge cases). For the current calendar
month:

- **Paid** — a payment has been recorded for this month
- **Overdue** — no payment recorded, and today is on or past the due day
- **Upcoming** — no payment recorded, but the due day hasn't arrived yet

Payments are tracked per calendar month (`YYYY-MM`), so "Mark paid" only affects the current
month — history for past months is kept on the client's detail page.

## Notes on running this in production

SQLite stores data in a single file (`prisma/dev.db`). That's fine for running the app
continuously on a machine or small VPS with persistent disk (e.g. a Docker container with a
mounted volume), but it will **not** work on stateless/serverless hosting (e.g. Vercel's default
deployment) since the filesystem isn't persisted between requests. To deploy there, switch the
Prisma datasource to a hosted Postgres database (e.g. Neon, Supabase, Vercel Postgres) — update
`prisma/schema.prisma`'s `provider` and `DATABASE_URL`, then re-run `npx prisma migrate deploy`.

Also set `NODE_ENV=production` (handled automatically by `npm run build && npm start`) so the
login cookie is marked `Secure`, and serve the app over HTTPS.
