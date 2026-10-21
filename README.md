# Habit Tracker

Track habits (Sleep and Weight), log daily entries, tick off days, and view
charts of your data. Built with Next.js 16, Postgres 17, and Docker.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Postgres 17** running in Docker (`docker-compose.yml`)
- **`pg`** driver with raw SQL (schema + seed live in `docker/init.sql`)
- **Recharts** for the dual-axis charts (number fields as lines, rating fields
  as bars)
- **Vitest** for unit + database integration tests, **Puppeteer** for the
  end-to-end smoke test

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

## Tests

```bash
npm test          # unit + database integration tests (Vitest)
npm run test:watch
npm run test:e2e  # boots the app and drives it with headless Chromium
```

- Unit tests cover the pure helpers in `src/lib/month.ts` and `src/lib/fields.ts`.
- Integration tests run against a throwaway `habit_tracker_test` database that
  is dropped and recreated on every run — your data is never touched.
- The e2e smoke test works in a far-future month and cleans up after itself.
  Set `CHROME_PATH` if Chromium is not at `/usr/bin/chromium`.

## Deployment

The production image is a multi-stage `Dockerfile` producing Next's standalone
output. Compose runs the app and the database together:

```bash
docker compose up --build
```

| Variable   | Default | Purpose                                  |
| ---------- | ------- | ---------------------------------------- |
| `APP_PORT` | `3000`  | Host port for the app                    |
| `DB_PORT`  | `5432`  | Host port for Postgres                   |

```bash
APP_PORT=8080 docker compose up --build
```

Both services have health checks, so `docker compose ps` shows `healthy` once
the stack is up. Database data lives in the `db-data` volume.

Backup and restore:

```bash
# backup
docker compose exec db pg_dump -U habit habit_tracker > backup.sql

# restore
docker compose exec -T db psql -U habit habit_tracker < backup.sql
```

## Configuration

`DATABASE_URL` lives in `.env` for local development
(`postgres://habit:habit@localhost:5432/habit_tracker`). Inside Docker Compose
it is overridden to `postgres://habit:habit@db:5432/habit_tracker` so the app
talks to the `db` service over the compose network. See `.env.example` for
every supported variable.

## Security

**The app has no authentication.** Anyone who can reach it can read and change
every entry. It is therefore bound to localhost by default:

| Service        | Default binding   | LAN-reachable? |
| -------------- | ----------------- | -------------- |
| App (compose)  | `127.0.0.1:3000`  | No             |
| Postgres       | `127.0.0.1:5432`  | No             |
| Dev server     | `127.0.0.1:3000`  | No             |

- `npm run dev` binds to localhost. `npm run dev:lan` binds to `0.0.0.0` — only
  use it on a network you trust.
- `APP_BIND=0.0.0.0` / `DB_BIND=0.0.0.0` do the same for Docker Compose.
- `DB_PASSWORD` sets the Postgres password (default `habit`). It only takes
  effect when the database volume is first created; to change it on an
  existing volume run
  `docker compose exec db psql -U habit -d habit_tracker -c "ALTER USER habit WITH PASSWORD 'new-password'"`
  and set the same value in `DB_PASSWORD`.
- Before deploying anywhere public, put authentication in front of the app
  (or keep it on a private network). Nothing in the repository contains
  secrets: `.env` is git-ignored, and the only credentials in the repo are the
  local development placeholders.


## Design

- `habits` — each habit defines its fields as JSON (`field_definitions`), e.g.
  Sleep = hours (number) + quality (rating 1–10), Weight = weight (number, kg).
  Future habits just add a row.
- `entries` — one row per habit/day (`values` JSON, notes, `done`), unique on
  `(habit_id, date)`, so saving a day upserts instead of duplicating.
- `done` — a standalone per-day tick used by the daily checklist, independent
  of the logged values. Unticking a day that has values keeps the values.
- The dashboard (`/`) shows every habit (stat tiles, chart, calendar) plus a
  combined daily checklist across habits; `/habits/[slug]` shows one habit in
  detail.
- Both views read the same rows, so a value logged in a habit's calendar shows
  up in the checklist, and a tick made in the checklist is visible as a ring on
  the habit's calendar.

### Adding a habit

```sql
INSERT INTO habits (name, slug, field_definitions) VALUES
  ('Water', 'water', '[{"key": "glasses", "label": "Glasses", "type": "number", "min": 0, "max": 20, "step": 1, "unit": "glasses"}]');
```

The habit appears on the dashboard immediately — no code changes. Field types
are `number` (rendered as a line), `rating` (rendered as bars) and `text`.
