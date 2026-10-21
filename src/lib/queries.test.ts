import { beforeEach, describe, expect, it } from "vitest";
import { resetTestDatabase } from "@/test/db";
import {
  deleteEntry,
  getHabitBySlug,
  listEntriesForMonth,
  listHabits,
  toggleEntryDone,
  upsertEntry,
} from "./queries";

const MONTH = "2026-09";
const START = `${MONTH}-01`;
const END = "2026-10-01";

async function sleepHabit() {
  const habit = await getHabitBySlug("sleep");
  if (!habit) throw new Error("seed habit missing");
  return habit;
}

beforeEach(async () => {
  await resetTestDatabase();
});

describe("listHabits", () => {
  it("returns the seeded habits", async () => {
    const habits = await listHabits();
    expect(habits.map((h) => h.slug).sort()).toEqual(["sleep", "weight"]);
  });

  it("exposes field definitions", async () => {
    const habit = await sleepHabit();
    expect(habit.field_definitions.map((f) => f.key)).toEqual([
      "hours",
      "quality",
    ]);
  });
});

describe("upsertEntry", () => {
  it("stores an entry", async () => {
    const habit = await sleepHabit();
    await upsertEntry({
      habitId: habit.id,
      date: "2026-09-04",
      values: { hours: 7.5, quality: 8 },
      notes: "good night",
    });

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(1);
    expect(entries[0].values).toEqual({ hours: 7.5, quality: 8 });
    expect(entries[0].notes).toBe("good night");
    expect(entries[0].done).toBe(false);
  });

  it("updates the same day instead of duplicating it", async () => {
    const habit = await sleepHabit();
    await upsertEntry({
      habitId: habit.id,
      date: "2026-09-04",
      values: { hours: 7 },
      notes: null,
    });
    await upsertEntry({
      habitId: habit.id,
      date: "2026-09-04",
      values: { hours: 8 },
      notes: null,
    });

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(1);
    expect(entries[0].values).toEqual({ hours: 8 });
  });

  it("only returns entries inside the requested month", async () => {
    const habit = await sleepHabit();
    await upsertEntry({
      habitId: habit.id,
      date: "2026-08-31",
      values: { hours: 6 },
      notes: null,
    });
    await upsertEntry({
      habitId: habit.id,
      date: "2026-09-01",
      values: { hours: 7 },
      notes: null,
    });
    await upsertEntry({
      habitId: habit.id,
      date: "2026-10-01",
      values: { hours: 8 },
      notes: null,
    });

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries.map((e) => e.date)).toEqual(["2026-09-01"]);
  });
});

describe("toggleEntryDone", () => {
  it("creates a ticked row for an empty day", async () => {
    const habit = await sleepHabit();
    const done = await toggleEntryDone(habit.id, "2026-09-05");
    expect(done).toBe(true);

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(1);
    expect(entries[0].done).toBe(true);
    expect(entries[0].values).toEqual({});
  });

  it("clears the tick and removes rows that hold no data", async () => {
    const habit = await sleepHabit();
    await toggleEntryDone(habit.id, "2026-09-05");
    const done = await toggleEntryDone(habit.id, "2026-09-05");
    expect(done).toBe(false);

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(0);
  });

  it("keeps logged values when unticking", async () => {
    const habit = await sleepHabit();
    await upsertEntry({
      habitId: habit.id,
      date: "2026-09-06",
      values: { hours: 7 },
      notes: null,
    });

    await toggleEntryDone(habit.id, "2026-09-06");
    await toggleEntryDone(habit.id, "2026-09-06");

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(1);
    expect(entries[0].done).toBe(false);
    expect(entries[0].values).toEqual({ hours: 7 });
  });

  it("does not disturb a tick when a value is saved", async () => {
    const habit = await sleepHabit();
    await toggleEntryDone(habit.id, "2026-09-07");
    await upsertEntry({
      habitId: habit.id,
      date: "2026-09-07",
      values: { hours: 6 },
      notes: null,
    });

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries[0].done).toBe(true);
    expect(entries[0].values).toEqual({ hours: 6 });
  });
});

describe("deleteEntry", () => {
  it("removes the row", async () => {
    const habit = await sleepHabit();
    await upsertEntry({
      habitId: habit.id,
      date: "2026-09-08",
      values: { hours: 7 },
      notes: null,
    });
    await deleteEntry(habit.id, "2026-09-08");

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(0);
  });
});
