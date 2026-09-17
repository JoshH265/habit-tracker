-- Habit Tracker schema + seed data.
-- This file is mounted into /docker-entrypoint-initdb.d/ and runs
-- automatically the first time the Postgres container's volume is created.

CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  field_definitions jsonb NOT NULL
);

CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date date NOT NULL,
  values jsonb NOT NULL,
  notes text,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

CREATE INDEX entries_habit_date_idx ON entries (habit_id, date);

-- Seed: the Sleep habit.
INSERT INTO habits (name, slug, field_definitions) VALUES (
  'Sleep',
  'sleep',
  '[
    {"key": "hours", "label": "Hours slept", "type": "number", "min": 0, "max": 24, "step": 0.5},
    {"key": "quality", "label": "Quality", "type": "rating", "min": 1, "max": 10}
  ]'::jsonb
);

-- Seed: the Weight habit (kg).
INSERT INTO habits (name, slug, field_definitions) VALUES (
  'Weight',
  'weight',
  '[
    {"key": "weight", "label": "Weight", "type": "number", "min": 0, "max": 500, "step": 0.1, "unit": "kg"}
  ]'::jsonb
);