"use client";

import { useTransition } from "react";
import { toggleDone } from "@/app/actions";
import { formatValues } from "@/lib/fields";
import type { DayCell, FieldDefinition } from "@/lib/types";

interface ChecklistHabit {
  id: string;
  slug: string;
  name: string;
  fieldDefinitions: FieldDefinition[];
}

interface ChecklistProps {
  habits: ChecklistHabit[];
  days: string[];
  cells: Record<string, Record<string, DayCell>>;
}

function weekdayShort(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function Checklist({ habits, days, cells }: ChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const today = todayISO();

  function toggle(habit: ChecklistHabit, date: string) {
    const fd = new FormData();
    fd.set("habitId", habit.id);
    fd.set("slug", habit.slug);
    fd.set("date", date);
    startTransition(async () => {
      await toggleDone(fd);
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-20 border border-zinc-200 bg-zinc-50 px-2 py-2 text-left text-xs font-medium text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Date
            </th>
            {habits.map((habit) => (
              <th
                key={habit.id}
                className="border border-zinc-200 bg-zinc-50 px-2 py-2 text-center text-xs font-medium text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {habit.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((date) => {
            const isToday = date === today;
            return (
              <tr
                key={date}
                className={isToday ? "bg-indigo-50/40 dark:bg-indigo-950/30" : undefined}
              >
                <td
                  className={`border border-zinc-200 px-2 py-1.5 dark:border-zinc-800 ${
                    isToday
                      ? "font-semibold text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  <span className="tabular-nums">{Number(date.slice(-2))}</span>
                  <span className="ml-1.5 text-xs text-zinc-400">
                    {weekdayShort(date)}
                  </span>
                </td>
                {habits.map((habit) => {
                  const cell = cells[habit.id]?.[date];
                  const done = cell?.done ?? false;
                  const summary = cell
                    ? formatValues(cell.values, habit.fieldDefinitions)
                    : "";
                  return (
                    <td
                      key={habit.id}
                      className="border border-zinc-200 px-2 py-1 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          aria-pressed={done}
                          aria-label={`${habit.name} ${date}${
                            done ? ", ticked" : ""
                          }`}
                          disabled={isPending}
                          onClick={() => toggle(habit, date)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm transition disabled:opacity-50 ${
                            done
                              ? "bg-indigo-600 text-white"
                              : "text-zinc-300 hover:bg-zinc-100 dark:text-zinc-700 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {done ? <span aria-hidden="true">✓</span> : null}
                        </button>
                        <span className="truncate text-xs text-zinc-400 tabular-nums">
                          {summary}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
