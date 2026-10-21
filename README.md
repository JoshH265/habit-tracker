# Habit Tracker

Track habits (Sleep and Weight), log daily entries, tick off days, and view
charts of your data. Built with Next.js 16, Postgres 17, and Docker.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Postgres 17** running in Docker (`docker-compose.yml`)
- **`pg`** driver with raw SQL (schema + seed live in `docker/init.sql`)
- **Recharts** for the dual-axis charts (number fields as lines, rating fields
  as bars)

## Quick start (development)

Postgres runs in Docker; the app runs on your host with hot reload.

```bash
# 1. Start the database
docker compose up -d db

# 2. Start the Next.js dev server
npm run dev
```

Open http://localhost:3000 (use `npm run dev -- -p 3001` if 3000 is taken).

The first time the `db` container starts, `docker/init.sql` creates the tables
and seeds the Sleep and Weight habits. To wipe and reseed, remove the volume:
`docker compose down -v` then `docker compose up -d db`.

## Run the full containerized app (production mode)

Builds the app image (multi-stage `Dockerfile` → standalone output) and runs
app + database together, both in Docker.

```bash
docker compose up --build
```

Open http://localhost:3000.

## Configuration

`DATABASE_URL` lives in `.env` for local development
(`postgres://habit:habit@localhost:5432/habit_tracker`). Inside Docker Compose
it is overridden to `postgres://habit:habit@db:5432/habit_tracker` so the app
talks to the `db` service over the compose network.

## Design

- `habits` — each habit defines its fields as JSON (`field_definitions`), e.g.
  Sleep = hours (number) + quality (rating 1–10), Weight = weight (number, kg).
  Future habits just add a row.
- `entries` — one row per habit/day (`values` JSON, notes, `done`), unique on
  `(habit_id, date)`, so saving a day upserts instead of duplicating.
- `done` — a standalone per-day tick used by the daily checklist, independent
  of the logged values.
- The dashboard (`/`) shows every habit (stat tiles, chart, calendar) plus a
  combined daily checklist across habits; `/habits/[slug]` shows one habit in
  detail.
