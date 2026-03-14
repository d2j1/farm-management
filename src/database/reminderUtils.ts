// ============================================================
// Farm Manager — Recurring Reminder Utilities
// ============================================================
// Pure functions — no database writes.  Use these to compute
// the "next reminder date" on the fly from a task's startDate
// and repeatIntervalDays.
// ============================================================

/**
 * Calculate the **next occurrence date** for a recurring task,
 * relative to a reference date (defaults to today).
 *
 * ### How it works
 * 1. From the task's `startDate`, step forward in increments of
 *    `repeatIntervalDays` until we land **on or after** `referenceDate`.
 * 2. Return that date as an ISO-8601 string (`YYYY-MM-DD`).
 *
 * ### Edge cases
 * - Returns `null` when `repeatIntervalDays` is 0 or negative
 *   (one-time / non-recurring task).
 * - If `startDate` is already **on or after** `referenceDate`,
 *   it is returned as-is (the first occurrence hasn't happened yet).
 *
 * ### Why no DB writes?
 * Instead of pre-populating future reminder rows, call this
 * function whenever you display upcoming reminders or schedule
 * a local notification.  This keeps the database lean.
 *
 * @param startDate          ISO-8601 date string of the task's first occurrence.
 * @param repeatIntervalDays Number of days between recurrences.
 * @param referenceDate      Optional — date to compute "next" relative to (defaults to today).
 * @returns                  ISO-8601 date string of the next occurrence, or `null`.
 *
 * @example
 * ```ts
 * // Task starts 2026-01-01, repeats every 7 days
 * // Today is 2026-03-07
 * getNextReminderDate('2026-01-01', 7);
 * // → '2026-03-12'   (the first repeat date on or after today)
 * ```
 */
export function getNextReminderDate(
  startDate: string,
  repeatIntervalDays: number,
  referenceDate?: string | Date,
): string | null {
  // Guard: non-recurring tasks
  if (!repeatIntervalDays || repeatIntervalDays <= 0) {
    return null;
  }

  const start = new Date(startDate);
  const ref   = referenceDate ? new Date(referenceDate) : new Date();

  // Strip time component — work with dates only
  start.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);

  // If the start date hasn't arrived yet, it IS the next reminder
  if (start >= ref) {
    return formatDate(start);
  }

  // Number of full intervals that have elapsed since start
  const msPerDay  = 86_400_000; // 24 * 60 * 60 * 1000
  const elapsed   = ref.getTime() - start.getTime();
  const intervals = Math.ceil(elapsed / (repeatIntervalDays * msPerDay));

  const next = new Date(start.getTime() + intervals * repeatIntervalDays * msPerDay);
  return formatDate(next);
}

/**
 * Generate a window of upcoming reminder dates for a recurring task.
 *
 * Useful for showing "next N reminders" in a list without
 * writing any rows to the database.
 *
 * @param startDate          ISO-8601 date of first occurrence.
 * @param repeatIntervalDays Days between recurrences.
 * @param count              How many future dates to return (default 5).
 * @param referenceDate      Compute relative to this date (default today).
 * @returns                  Array of ISO-8601 date strings.
 */
export function getUpcomingReminderDates(
  startDate: string,
  repeatIntervalDays: number,
  count: number = 5,
  referenceDate?: string | Date,
): string[] {
  const first = getNextReminderDate(startDate, repeatIntervalDays, referenceDate);
  if (!first) return [];

  const msPerDay = 86_400_000;
  const dates: string[] = [];
  let current = new Date(first);

  for (let i = 0; i < count; i++) {
    dates.push(formatDate(current));
    current = new Date(current.getTime() + repeatIntervalDays * msPerDay);
  }

  return dates;
}

// ---- Helpers -----------------------------------------------

/** Format a Date as YYYY-MM-DD (local time). */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

