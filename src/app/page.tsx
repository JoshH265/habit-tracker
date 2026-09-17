import Link from "next/link";
import { listHabits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const habits = await listHabits();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Your habits</h1>

      {habits.length === 0 ? (
        <p className="mt-4 text-zinc-500">
          No habits yet. Add one to the database and it will show up here.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {habits.map((habit) => (
            <li key={habit.id}>
              <Link
                href={`/habits/${habit.slug}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <span className="font-medium">{habit.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}