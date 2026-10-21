import Link from "next/link";
import { notFound } from "next/navigation";
import { getHabitBySlug, listEntriesForMonth } from "@/lib/queries";
import {
  MONTH_RE,
  currentMonth,
  leadingBlanksFor,
  monthDays,
  monthLabel,
  shiftMonth,
} from "@/lib/month";
import { HabitSection } from "@/components/habit-section";

export const dynamic = "force-dynamic";

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

      <div className="mt-6">
        <HabitSection
          habit={habit}
          month={month}
          entries={entries}
          days={monthDays(month)}
          leadingBlanks={leadingBlanksFor(month)}
          showDetailsLink={false}
          showMonthLabel={false}
        />
      </div>
    </main>
  );
}
