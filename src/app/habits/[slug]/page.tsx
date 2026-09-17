import Link from "next/link";
import { notFound } from "next/navigation";
import { getHabitBySlug, listEntriesForMonth } from "@/lib/queries";
import { EntryForm } from "@/components/entry-form";
import { HabitChart } from "@/components/habit-chart";

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-\d{2}$/;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function lastDayOfMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

function formatAvg(value: number | null): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface StatTile {
  label: string;
  value: string;
  hint: string;
}

export default async function HabitPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const month =
    typeof query.month === "string" && MONTH_RE.test(query.month)
      ? query.month
      : currentMonth();

  const habit = await getHabitBySlug(slug);
  if (!habit) notFound();

  const start = `${month}-01`;
  const end = `${shiftMonth(month, 1)}-01`;
  const entries = await listEntriesForMonth(habit.id, start, end);

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  const days = Array.from({ length: lastDayOfMonth(month) }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    return date;
  });

  const [y, m] = month.split("-").map(Number);
  const leadingBlanks = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;

  const chartData = entries.map((e) => ({ date: e.date, ...e.values }));

  const numberFields = habit.field_definitions.filter((f) => f.type === "number");
  const ratingFields = habit.field_definitions.filter((f) => f.type === "rating");

  const averageOf = (key: string): number | null => {
    const values = entries
      .map((e) => Number(e.values[key]))
      .filter((v) => Number.isFinite(v));
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const statTiles: StatTile[] = [
    { label: "Nights logged", value: String(entries.length), hint: "this month" },
    ...numberFields.map((f) => ({
      label: `Avg ${f.label.toLowerCase()}`,
      value: formatAvg(averageOf(f.key)),
      hint: "this month",
    })),
    ...ratingFields.map((f) => ({
      label: `Avg ${f.label.toLowerCase()}`,
      value: formatAvg(averageOf(f.key)),
      hint: `${f.min ?? 1}–${f.max ?? 10} scale`,
    })),
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        &larr; All habits
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{habit.name}</h1>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Link
            href={`/habits/${slug}?month=${prev}`}
            aria-label="Previous month"
            className="rounded-l-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            &larr;
          </Link>
          <span className="min-w-32 text-center">{monthLabel(month)}</span>
          <Link
            href={`/habits/${slug}?month=${next}`}
            aria-label="Next month"
            className="rounded-r-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            &rarr;
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
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

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Chart</h2>
          <span className="text-xs text-zinc-400">{monthLabel(month)}</span>
        </div>
        {entries.length === 0 ? (
          <p className="border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No entries for {monthLabel(month)} yet. Click a day in the calendar
            below to log the first one.
          </p>
        ) : (
          <div className="mt-4">
            <HabitChart
              data={chartData}
              fieldDefinitions={habit.field_definitions}
            />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-semibold">Calendar</h2>
        <EntryForm
          key={month}
          slug={habit.slug}
          habitId={habit.id}
          fieldDefinitions={habit.field_definitions}
          entries={entries}
          days={days}
          leadingBlanks={leadingBlanks}
        />
      </section>
    </main>
  );
}