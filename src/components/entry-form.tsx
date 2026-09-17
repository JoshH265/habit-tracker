"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { saveEntry, removeEntry } from "@/app/actions";
import type { Entry, FieldDefinition } from "@/lib/types";

interface EntryFormProps {
  slug: string;
  habitId: string;
  fieldDefinitions: FieldDefinition[];
  entries: Entry[];
  days: string[];
  leadingBlanks: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function entryValuesToForm(entry?: Entry): Record<string, string> {
  const values: Record<string, string> = {};
  if (entry) {
    for (const [key, value] of Object.entries(entry.values)) {
      values[key] = String(value);
    }
  }
  return values;
}

function dayLabelEntry(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
  });
  return `${weekday} ${d}`;
}

function fieldInputClass(): string {
  return "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";
}

export function EntryForm({
  slug,
  habitId,
  fieldDefinitions,
  entries,
  days,
  leadingBlanks,
}: EntryFormProps) {
  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const entry of entries) map.set(entry.date, entry);
    return map;
  }, [entries]);

  const calendarRef = useRef<HTMLDivElement>(null);

  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const entry = activeDate ? entriesByDate.get(activeDate) : undefined;

  function closeBubble() {
    setActiveDate(null);
  }

  function openDay(date: string) {
    if (date === activeDate) {
      closeBubble();
      return;
    }
    setActiveDate(date);
    setValues(entryValuesToForm(entriesByDate.get(date)));
    setNotes(entriesByDate.get(date)?.notes ?? "");
    setFormError(null);
  }

  useEffect(() => {
    if (!activeDate) return;
    function onPointerDown(e: PointerEvent) {
      if (
        calendarRef.current &&
        e.target instanceof Node &&
        !calendarRef.current.contains(e.target)
      ) {
        setActiveDate(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeDate]);

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    const isDelete = submitter?.dataset.action === "delete";
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      setFormError(null);
      try {
        if (isDelete) {
          await removeEntry(fd);
        } else {
          await saveEntry(fd);
        }
        closeBubble();
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      }
    });
  }

  const activeIndex = activeDate ? days.indexOf(activeDate) : -1;
  const totalIndex = activeIndex >= 0 ? activeIndex + leadingBlanks : -1;
  const colIndex = totalIndex >= 0 ? totalIndex % 7 : 0;
  const rowIndex = totalIndex >= 0 ? Math.floor(totalIndex / 7) : 0;
  const totalRows = Math.ceil((leadingBlanks + days.length) / 7);
  const isLeftAligned = colIndex < 4;
  const opensBelow = rowIndex < totalRows - 1;

  return (
    <div ref={calendarRef} className="mx-auto mt-4 w-full max-w-sm">
      <div
        className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400"
        aria-hidden="true"
      >
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1.5">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((date) => {
          const dayEntry = entriesByDate.get(date);
          const isActive = date === activeDate;
          const dayNumber = Number(date.slice(-2));
          const dayClasses = isActive
            ? "bg-indigo-600 font-semibold text-white shadow-sm"
            : dayEntry
              ? "font-medium text-zinc-900 hover:bg-indigo-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800";

          return (
            <div key={date} className="relative flex justify-center py-0.5">
              <button
                type="button"
                onClick={() => openDay(date)}
                aria-pressed={isActive}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-base leading-none transition ${dayClasses}`}
              >
                {dayNumber}
                {dayEntry && (
                  <span
                    className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      isActive ? "bg-white/90" : "bg-indigo-500"
                    }`}
                  />
                )}
              </button>

              {isActive && (
                <div
                  className={`pointer-events-none absolute z-40 w-72 max-w-[calc(100vw-2rem)] ${
                    opensBelow ? "top-0" : "bottom-0"
                  } ${isLeftAligned ? "left-full ml-2.5" : "right-full mr-2.5"}`}
                >
                  <div
                    className={`relative rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900`}
                  >
                    <span
                      className={`absolute h-2.5 w-2.5 rotate-45 bg-white dark:bg-zinc-900 ${
                        isLeftAligned
                          ? "-left-1 border-l border-b border-zinc-200 dark:border-zinc-700"
                          : "-right-1 border-r border-t border-zinc-200 dark:border-zinc-700"
                      } ${opensBelow ? "top-4" : "bottom-4"}`}
                    />

                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {dayLabelEntry(activeDate!)}
                      </p>
                      <button
                        type="button"
                        onClick={closeBubble}
                        aria-label="Close"
                        className="pointer-events-auto rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form
                      action={saveEntry}
                      onSubmit={handleSubmit}
                      className="pointer-events-auto space-y-3"
                    >
                      <input type="hidden" name="habitId" value={habitId} />
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="date" value={activeDate!} />

                      {fieldDefinitions.map((def) => {
                        if (def.type === "text") {
                          return (
                            <label key={def.key} className="block">
                              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {def.label}
                              </span>
                              <input
                                type="text"
                                name={`value_${def.key}`}
                                value={values[def.key] ?? ""}
                                onChange={(e) => setField(def.key, e.target.value)}
                                className={fieldInputClass()}
                              />
                            </label>
                          );
                        }

                        if (def.type === "rating") {
                          const options: number[] = [];
                          for (
                            let i = def.min ?? 1;
                            i <= (def.max ?? 5);
                            i += 1
                          ) {
                            options.push(i);
                          }
                          return (
                            <label key={def.key} className="block">
                              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {def.label}
                              </span>
                              <select
                                name={`value_${def.key}`}
                                value={values[def.key] ?? ""}
                                onChange={(e) => setField(def.key, e.target.value)}
                                className={fieldInputClass()}
                              >
                                <option value="">—</option>
                                {options.map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </label>
                          );
                        }

                        return (
                          <label key={def.key} className="block">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {def.label}
                              {def.unit ? ` (${def.unit})` : ""}
                            </span>
                            <input
                              type="number"
                              name={`value_${def.key}`}
                              value={values[def.key] ?? ""}
                              onChange={(e) => setField(def.key, e.target.value)}
                              step={def.step}
                              min={def.min}
                              max={def.max}
                              className={fieldInputClass()}
                            />
                          </label>
                        );
                      })}

                      <label className="block">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Notes
                        </span>
                        <textarea
                          name="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className={fieldInputClass()}
                        />
                      </label>

                      {formError && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                          {formError}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                        >
                          {isPending ? "Saving…" : "Confirm"}
                        </button>
                        {entry && (
                          <button
                            type="submit"
                            data-action="delete"
                            formAction={removeEntry}
                            disabled={isPending}
                            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}