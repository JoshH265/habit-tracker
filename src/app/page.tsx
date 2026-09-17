import Link from "next/link";
import { Checklist } from "@/components/checklist";
import { HabitSection } from "@/components/habit-section";
import {
  MONTH_RE,
  currentMonth,
  leadingBlanksFor,
  monthDays,
  monthLabel,
  shiftMonth,
} from "@/lib/month";
import { listEntriesForMonth, listHabits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const month =
    typeof query.month === "string" && MONTH_RE.test(query.month)
      ? query.month
      : currentMonth();

  const habits = await listHabits();

  const start = `${month}-01`;
  const end = `${shiftMonth(month, 1)}-01`;
  const days = monthDays(month);
  const leadingBlanks = leadingBlanksFor(month);

  const sections = await Promise.all(
    habits.map(async (habit) => ({
      habit,
      entries: await listEntriesForMonth(habit.id, start, end),
    }))
  );

  const doneByHabit: Record<string, string[]> = {};
  for (const section of sections) {
    doneByHabit[section.habit.id] = section.entries
      .filter((e) => e.done)
      .map((e) => e.date);
  }

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Your habits</h1>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Link
            href={`/?month=${prev}`}
            aria-label="Previous month"
            className="rounded-l-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            &larr;
          </Link>
          <span className="min-w-32 text-center">{monthLabel(month)}</span>
          <Link
            href={`/?month=${next}`}
            aria-label="Next month"
            className="rounded-r-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            &rarr;
          </Link>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mt-6 text-zinc-500">
          No habits yet. Add one to the database and it will show up here.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <HabitSection
              key={section.habit.id}
              habit={section.habit}
              month={month}
              entries={section.entries}
              days={days}
              leadingBlanks={leadingBlanks}
            />
          ))}

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">Daily checklist</h2>
              <span className="text-xs text-zinc-400">
                click a cell to tick whether you did it that day
              </span>
            </div>
            <div className="mt-3">
              <Checklist
                habits={habits.map((h) => ({
                  id: h.id,
                  slug: h.slug,
                  name: h.name,
                }))}
                days={days}
                doneByHabit={doneByHabit}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}