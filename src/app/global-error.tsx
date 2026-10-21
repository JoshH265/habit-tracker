"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <main className="mx-auto flex min-h-screen w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-xs font-medium tracking-wide text-red-600 uppercase dark:text-red-400">
            Something went wrong
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            The app hit an unexpected error
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {error.message || "No further details are available."}
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-400">Reference: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
