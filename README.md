# Orbit CRM

A detailed CRM for tracking contacts, companies, deals, and tasks — built with Next.js, Prisma, and Postgres, deployed on Vercel.

## Features

- **Contacts & Companies** — full records with notes, linked company/contact relationships, and search
- **Deals pipeline** — drag-and-drop Kanban board across Lead → Qualified → Proposal → Negotiation → Won/Lost, with pipeline value per stage
- **Tasks & activities** — to-dos, calls, emails, meetings, and notes logged on a timeline against any contact, company, or deal
- **Dashboard** — key metrics, pipeline-by-stage chart, upcoming tasks, and a recent activity feed
- **Global search** across contacts, companies, and deals
- **Authentication** — email/password accounts with signed, HTTP-only session cookies (no third-party auth service required)

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, TypeScript)
- [Prisma](https://www.prisma.io) ORM on PostgreSQL
- [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://www.radix-ui.com) primitives
- [dnd-kit](https://dndkit.com) for the deals Kanban board
- [Recharts](https://recharts.org) for the dashboard chart
- `bcryptjs` + `jose` for password hashing and signed session cookies

## Getting started locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. `postgresql://user:password@localhost:5432/orbit_crm` |
| `AUTH_SECRET` | Random secret used to sign session cookies. Generate one with `openssl rand -base64 32` |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | Optional — used by `npm run db:seed` to create a demo user |

### 3. Set up the database

Run this against any Postgres instance (local, Docker, or a hosted service — see below):

```bash
npm run db:migrate   # applies migrations and generates the Prisma client
npm run db:seed       # optional: creates a demo user + sample data
```

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). If you ran `db:seed`, sign in with the credentials from `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` (defaults: `demo@orbitcrm.app` / `password123`). Otherwise, use the **Create one** link on the sign-in page to register the first account.

## Deploying to Vercel

1. **Push this repository to GitHub** (already done if you're reading this from the repo).
2. **Create a Postgres database.** The easiest options that integrate directly with Vercel:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (powered by Neon) — add it from your Vercel project's **Storage** tab, which automatically sets `DATABASE_URL` for you.
   - Or any external Postgres provider (Neon, Supabase, Railway, etc.) — copy its connection string.
3. **Import the repository into Vercel** at [vercel.com/new](https://vercel.com/new) and select this repo.
4. **Set environment variables** in the Vercel project settings (Settings → Environment Variables):
   - `DATABASE_URL` — your Postgres connection string (skip this if you used Vercel Postgres, which sets it automatically)
   - `AUTH_SECRET` — a random string (`openssl rand -base64 32`)
5. **Deploy.** The build command (`npm run build`) runs `prisma generate` automatically before `next build` via the `build` script, and `postinstall` also runs `prisma generate` as a safety net.
6. **Run the initial migration** against your production database once, from your local machine (with `DATABASE_URL` pointed at production) or via the Vercel CLI:

   ```bash
   DATABASE_URL="<your-production-url>" npx prisma migrate deploy
   ```

7. Optionally seed a first user the same way:

   ```bash
   DATABASE_URL="<your-production-url>" npm run db:seed
   ```

   Or just visit `/register` on the deployed site to create your first account.

## Project structure

```
prisma/schema.prisma        Data model (User, Company, Contact, Deal, Activity)
prisma/seed.ts               Demo data seed script
src/lib/auth.ts              Session cookie signing/verification
src/lib/actions/             Server Actions for all CRUD operations
src/proxy.ts                 Route protection (redirects unauthenticated users to /login)
src/components/ui/           Reusable UI primitives (button, input, dialog, table, ...)
src/app/(auth)/              Login and register pages
src/app/(dashboard)/         Authenticated app: dashboard, contacts, companies, deals, tasks, search
```

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run lint` | Lint the codebase |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (used in production) |
| `npm run db:seed` | Seed a demo user and sample data |
| `npm run db:studio` | Open Prisma Studio to browse the database |
