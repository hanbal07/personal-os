/**
 * â”€â”€â”€ Timezone strategy (documented) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 * 1. The user's IANA timezone lives in UserSettings.timezone
 *    (default "Asia/Karachi"). It is resolved per request â€” never assumed
 *    from server clock or env.
 *
 * 2. "Today" = the calendar date (YYYY-MM-DD) of the current instant in the
 *    user's timezone, computed via Intl.DateTimeFormat (Node built-in ICU).
 *
 * 3. All daily models use Prisma `@db.Date`. A date string is converted to a
 *    JS Date anchored at **12:00:00 UTC** of that calendar day before any
 *    Prisma call (getDbDate). PostgreSQL stores only Y-M-D for date columns;
 *    the noon-UTC anchor guarantees that UTC-vs-session-timezone truncation
 *    can never shift the stored day by one.
 *
 * 4. Equality queries pass exactly that anchored value; range queries use
 *    noonUTC(startLocalDate) / noonUTC(endLocalDate).
 *
 * 5. Client pages may send their own local date (?date=YYYY-MM-DD). The
 *    server validates the format and uses it verbatim; when absent, the
 *    server derives "today" from the user's timezone (getUserDateContext).
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

export const DEFAULT_TIMEZONE = "Asia/Karachi";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function normalizeTimezone(timezone?: string | null): string {
  if (!timezone || typeof timezone !== "string") return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Calendar date (YYYY-MM-DD) of instant `when` in `timezone`. */
export function getUserLocalDate(timezone: string, when: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
}

/** Local wall-clock hour (0-23) of instant `when` in `timezone`. */
export function getUserLocalHour(timezone: string, when: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).format(when);
  return parseInt(hour, 10) % 24;
}

/** User-local calendar day -> DB-safe Date (noon-UTC anchor; see strategy). */
export function getDbDate(dateStr: string): Date {
  if (!isValidDateString(dateStr)) {
    throw new Error(`Invalid date string: ${String(dateStr)}`);
  }
  return new Date(`${dateStr}T12:00:00.000Z`);
}

/** YYYY-MM-DD + n days -> YYYY-MM-DD (pure calendar arithmetic on UTC anchor). */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
