import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestDatabase } from "@/test/db";
import { listEntriesForMonth, getHabitBySlug } from "@/lib/queries";
import { removeEntry, saveEntry, toggleDone } from "./actions";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const START = "2026-09-01";
const END = "2026-10-01";

async function sleepHabit() {
  const habit = await getHabitBySlug("sleep");
  if (!habit) throw new Error("seed habit missing");
  return habit;
}

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

beforeEach(async () => {
  revalidatePath.mockClear();
  await resetTestDatabase();
});

describe("saveEntry", () => {
  it("saves values and notes", async () => {
    const habit = await sleepHabit();
    await saveEntry(
      form({
        habitId: habit.id,
        slug: habit.slug,
        date: "2026-09-02",
        value_hours: "7.5",
        value_quality: "8",
        notes: "slept well",
      })
    );

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(1);
    expect(entries[0].values).toEqual({ hours: 7.5, quality: 8 });
    expect(entries[0].notes).toBe("slept well");
  });

  it("saves a notes-only entry", async () => {
    const habit = await sleepHabit();
    await saveEntry(
      form({
        habitId: habit.id,
        slug: habit.slug,
        date: "2026-09-03",
        value_hours: "",
        value_quality: "",
        notes: "just a note",
      })
    );

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(1);
    expect(entries[0].values).toEqual({});
    expect(entries[0].notes).toBe("just a note");
  });

  it("ignores a completely empty submission", async () => {
    const habit = await sleepHabit();
    await saveEntry(
      form({
        habitId: habit.id,
        slug: habit.slug,
        date: "2026-09-04",
        value_hours: "",
        value_quality: "",
        notes: "",
      })
    );

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(0);
  });

  it("rejects impossible dates", async () => {
    const habit = await sleepHabit();
    await expect(
      saveEntry(
        form({
          habitId: habit.id,
          slug: habit.slug,
          date: "2026-02-31",
          value_hours: "7",
        })
      )
    ).rejects.toThrow("Invalid date");
  });

  it("rejects values outside the field range", async () => {
    const habit = await sleepHabit();
    await expect(
      saveEntry(
        form({
          habitId: habit.id,
          slug: habit.slug,
          date: "2026-09-05",
          value_hours: "99",
        })
      )
    ).rejects.toThrow("Invalid value for Hours slept");
  });

  it("revalidates the dashboard and the habit page", async () => {
    const habit = await sleepHabit();
    await saveEntry(
      form({
        habitId: habit.id,
        slug: habit.slug,
        date: "2026-09-06",
        value_hours: "7",
      })
    );

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/habits/sleep");
  });
});

describe("toggleDone", () => {
  it("ticks and unticks a day", async () => {
    const habit = await sleepHabit();
    await toggleDone(
      form({ habitId: habit.id, slug: habit.slug, date: "2026-09-09" })
    );

    let entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries[0].done).toBe(true);

    await toggleDone(
      form({ habitId: habit.id, slug: habit.slug, date: "2026-09-09" })
    );
    entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(0);
  });

  it("revalidates the dashboard", async () => {
    const habit = await sleepHabit();
    await toggleDone(
      form({ habitId: habit.id, slug: habit.slug, date: "2026-09-10" })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("removeEntry", () => {
  it("deletes the entry and revalidates the dashboard", async () => {
    const habit = await sleepHabit();
    await saveEntry(
      form({
        habitId: habit.id,
        slug: habit.slug,
        date: "2026-09-11",
        value_hours: "7",
      })
    );
    revalidatePath.mockClear();

    await removeEntry(
      form({ habitId: habit.id, slug: habit.slug, date: "2026-09-11" })
    );

    const entries = await listEntriesForMonth(habit.id, START, END);
    expect(entries).toHaveLength(0);
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("rejects impossible dates", async () => {
    const habit = await sleepHabit();
    await expect(
      removeEntry(
        form({ habitId: habit.id, slug: habit.slug, date: "2026-13-01" })
      )
    ).rejects.toThrow("Invalid date");
  });
});
