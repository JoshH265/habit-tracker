export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl flex-1 px-4 py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-6 space-y-6">
        {[0, 1].map((section) => (
          <div
            key={section}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="h-5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((tile) => (
                <div
                  key={tile}
                  className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60"
                />
              ))}
            </div>
            <div className="mt-5 h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </main>
  );
}
