import "server-only";
import { getPool } from "./db";
import type { Entry, Habit } from "./types";

export async function listHabits(): Promise<Habit[]> {
  const { rows } = await getPool().query<Habit>(
    `SELECT id, name, slug, field_definitions
     FROM habits
     ORDER BY name`
  );
  return rows;
}

export async function getHabitBySlug(slug: string): Promise<Habit | null> {
  const { rows } = await getPool().query<Habit>(
    `SELECT id, name, slug, field_definitions
     FROM habits
     WHERE slug = $1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const { rows } = await getPool().query<Habit>(
    `SELECT id, name, slug, field_definitions
     FROM habits
     WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listEntriesForMonth(
  habitId: string,
  start: string,
  end: string
): Promise<Entry[]> {
  const { rows } = await getPool().query<Entry>(
    `SELECT id, habit_id, date::text AS date, values, notes, created_at, updated_at
     FROM entries
     WHERE habit_id = $1 AND date >= $2 AND date < $3
     ORDER BY date`,
    [habitId, start, end]
  );
  return rows;
}

export async function upsertEntry(input: {
  habitId: string;
  date: string;
  values: Record<string, number | string>;
  notes: string | null;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO entries (habit_id, date, values, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (habit_id, date)
     DO UPDATE SET
       values = EXCLUDED.values,
       notes = EXCLUDED.notes,
       updated_at = now()`,
    [input.habitId, input.date, JSON.stringify(input.values), input.notes]
  );
}

export async function deleteEntry(
  habitId: string,
  date: string
): Promise<void> {
  await getPool().query(`DELETE FROM entries WHERE habit_id = $1 AND date = $2`, [
    habitId,
    date,
  ]);
}