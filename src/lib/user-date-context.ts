import { db } from "@/lib/db";
import { normalizeTimezone, isValidDateString, getUserLocalDate, getDbDate } from "./user-date";

// Convenience re-exports so routes can import everything from one module.
export {
  DEFAULT_TIMEZONE,
  isValidDateString,
  normalizeTimezone,
  getUserLocalDate,
  getUserLocalHour,
  getDbDate,
  addDays,
} from "./user-date";

export interface UserDateContext {
  timezone: string;
  /** Resolved calendar date (requested ?date= if valid, else user-local today). */
  dateStr: string;
  /** DB-safe Date for dateStr (noon-UTC anchor). */
  date: Date;
}

/**
 * Resolve the per-user date context for a request:
 * - explicit valid ?date= wins, else user-local today in their settings tz.
 */
export async function getUserDateContext(
  userId: string,
  requestedDate?: string | null
): Promise<UserDateContext> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  const timezone = normalizeTimezone(settings?.timezone);
  let dateStr: string;
  if (requestedDate !== undefined && requestedDate !== null && requestedDate !== "") {
    if (!isValidDateString(requestedDate)) {
      throw new Error("INVALID_DATE");
    }
    dateStr = requestedDate;
  } else {
    dateStr = getUserLocalDate(timezone);
  }
  return { timezone, dateStr, date: getDbDate(dateStr) };
}
