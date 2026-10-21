"use server";

import { revalidatePath } from "next/cache";
import { isValidISODate } from "@/lib/month";
import {
  deleteEntry,
  getHabitById,
  toggleEntryDone,
  upsertEntry,
} from "@/lib/queries";

function readDate(formData: FormData): string {
  const date = String(formData.get("date") ?? "");
  if (!isValidISODate(date)) {
    throw new Error("Invalid date");
  }
  return date;
}

function revalidateHabit(slug: string) {
  revalidatePath("/");
  revalidatePath(`/habits/${slug}`);
}

export async function saveEntry(formData: FormData) {
  const habitId = String(formData.get("habitId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const date = readDate(formData);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const habit = await getHabitById(habitId);
  if (!habit) throw new Error("Habit not found");

  const values: Record<string, number | string> = {};

  for (const def of habit.field_definitions) {
    if (def.type === "text") {
      const raw = String(formData.get(`value_${def.key}`) ?? "").trim();
      if (raw) values[def.key] = raw;
      continue;
    }

    const raw = String(formData.get(`value_${def.key}`) ?? "");
    if (raw === "") continue;

    const num = Number(raw);
    if (
      Number.isNaN(num) ||
      num < (def.min ?? Number.NEGATIVE_INFINITY) ||
      num > (def.max ?? Number.POSITIVE_INFINITY)
    ) {
      throw new Error(`Invalid value for ${def.label}`);
    }
    values[def.key] = num;
  }

  const hasData = Object.keys(values).length > 0;
  if (!hasData && !notes) return;

  await upsertEntry({ habitId, date, values, notes });
  revalidateHabit(slug);
}

export async function toggleDone(formData: FormData) {
  const habitId = String(formData.get("habitId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const date = readDate(formData);

  const habit = await getHabitById(habitId);
  if (!habit) throw new Error("Habit not found");

  await toggleEntryDone(habitId, date);
  revalidateHabit(slug);
}

export async function removeEntry(formData: FormData) {
  const habitId = String(formData.get("habitId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const date = readDate(formData);

  const habit = await getHabitById(habitId);
  if (!habit) throw new Error("Habit not found");

  await deleteEntry(habitId, date);
  revalidateHabit(slug);
}
