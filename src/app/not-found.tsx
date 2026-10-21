import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
        404
      </p>
      <h2 className="text-xl font-semibold tracking-tight">Page not found</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        That habit doesn&apos;t exist, or the page has moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
