"use server";

import { revalidatePath } from "next/cache";
import {
  deleteEntry,
  getHabitById,
  toggleEntryDone,
  upsertEntry,
} from "@/lib/queries";

export async function saveEntry(formData: FormData) {
  const habitId = String(formData.get("habitId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const date = String(formData.get("date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date");
  }

  const habit = await getHabitById(habitId);
  if (!habit) throw new Error("Habit not found");

  const values: Record<string, number | string> = {};
  let hasData = false;

  for (const def of habit.field_definitions) {
    if (def.type === "text") {
      const raw = String(formData.get(`value_${def.key}`) ?? "").trim();
      if (raw) {
        values[def.key] = raw;
        hasData = true;
      }
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
    hasData = true;
  }

  if (!hasData) return;

  await upsertEntry({ habitId, date, values, notes });
  revalidatePath(`/habits/${slug}`);
}

export async function toggleDone(formData: FormData) {
  const habitId = String(formData.get("habitId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const date = String(formData.get("date") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date");
  }

  const habit = await getHabitById(habitId);
  if (!habit) throw new Error("Habit not found");

  await toggleEntryDone(habitId, date);
  revalidatePath("/");
  revalidatePath(`/habits/${slug}`);
}

export async function removeEntry(formData: FormData) {
  const habitId = String(formData.get("habitId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const date = String(formData.get("date") ?? "");

  const habit = await getHabitById(habitId);
  if (!habit) throw new Error("Habit not found");

  await deleteEntry(habitId, date);
  revalidatePath(`/habits/${slug}`);
}