import Link from "next/link";
import { formatAvg, monthLabel } from "@/lib/month";
import type { Entry, Habit } from "@/lib/types";
import { EntryForm } from "./entry-form";
import { HabitChart } from "./habit-chart";

interface HabitSectionProps {
  habit: Habit;
  month: string;
  entries: Entry[];
  days: string[];
  leadingBlanks: number;
}

interface StatTile {
  label: string;
  value: string;
  hint: string;
}

export function HabitSection({
  habit,
  month,
  entries,
  days,
  leadingBlanks,
}: HabitSectionProps) {
  const numberFields = habit.field_definitions.filter(
    (f) => f.type === "number"
  );
  const ratingFields = habit.field_definitions.filter((f) => f.type === "rating");

  const averageOf = (key: string): number | null => {
    const values = entries
      .map((e) => Number(e.values[key]))
      .filter((v) => Number.isFinite(v));
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const entriesCountLabel = habit.slug === "sleep" ? "Nights logged" : "Days logged";

  const statTiles: StatTile[] = [
    { label: entriesCountLabel, value: String(entries.length), hint: "this month" },
    ...numberFields.map((f) => ({
      label: `Avg ${f.label.toLowerCase()}`,
      value: formatAvg(averageOf(f.key)),
      hint: f.unit ? `${f.unit} · this month` : "this month",
    })),
    ...ratingFields.map((f) => ({
      label: `Avg ${f.label.toLowerCase()}`,
      value: formatAvg(averageOf(f.key)),
      hint: `${f.min ?? 1}–${f.max ?? 10} scale`,
    })),
  ];

  const chartData = entries.map((e) => ({ date: e.date, ...e.values }));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{habit.name}</h2>
        <Link
          href={`/habits/${habit.slug}?month=${month}`}
          className="text-sm text-zinc-500 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Details &rarr;
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-zinc-400">{monthLabel(month)}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {tile.value}
            </p>
            <p className="text-xs text-zinc-400">{tile.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        {entries.length === 0 ? (
          <p className="border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No entries for {monthLabel(month)} yet. Click a day in the calendar
            below to log the first one.
          </p>
        ) : (
          <HabitChart
            data={chartData}
            fieldDefinitions={habit.field_definitions}
          />
        )}
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <EntryForm
          key={`${habit.slug}-${month}`}
          slug={habit.slug}
          habitId={habit.id}
          fieldDefinitions={habit.field_definitions}
          entries={entries}
          days={days}
          leadingBlanks={leadingBlanks}
        />
      </div>
    </section>
  );
}