"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-xs font-medium tracking-wide text-red-600 uppercase dark:text-red-400">
        Something went wrong
      </p>
      <h2 className="text-xl font-semibold tracking-tight">
        We couldn&apos;t load this page
      </h2>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {error.message ||
          "The database may be unreachable. Check that the db container is running, then try again."}
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-400">Reference: {error.digest}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
