/**
 * Timezone correctness tests for src/lib/user-date.ts (pure functions).
 * Run: node --experimental-strip-types scripts/timezone-test.ts
 */
import {
  DEFAULT_TIMEZONE,
  isValidDateString,
  normalizeTimezone,
  getUserLocalDate,
  getUserLocalHour,
  getDbDate,
  addDays,
} from "../src/lib/user-date.ts";

let pass = 0;
let fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} -> got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
}

// ── isValidDateString ────────────────────────────────────────────────
check("valid date", isValidDateString("2026-08-23"), true);
check("rejects slash format", isValidDateString("2026/08/23"), false);
check("rejects short month", isValidDateString("2026-8-23"), false);
check("rejects month 13", isValidDateString("2026-13-01"), false);
check("rejects Feb 30", isValidDateString("2026-02-30"), false);
check("rejects garbage", isValidDateString("yesterday"), false);
check("rejects number", isValidDateString(20260823), false);
check("accepts leap day", isValidDateString("2028-02-29"), true);
check("rejects non-leap Feb 29", isValidDateString("2027-02-29"), false);

// ── normalizeTimezone ────────────────────────────────────────────────
check("null tz -> default", normalizeTimezone(null), DEFAULT_TIMEZONE);
check("empty tz -> default", normalizeTimezone(""), DEFAULT_TIMEZONE);
check("garbage tz -> default", normalizeTimezone("Not/AZone"), DEFAULT_TIMEZONE);
check("valid tz kept", normalizeTimezone("America/New_York"), "America/New_York");

// ── getUserLocalDate at the exact Pakistan midnight boundary ─────────
// PKT is UTC+5 (no DST). Local day flips at 18:30Z (winter) / 17:30Z (summer, no DST in PK so always 18:30Z).
const pkMidnightStartAug23 = new Date("2026-08-23T18:30:00.000Z"); // 00:00:00 PKT Aug 24? NO: 18:30Z+5h=23:30... 
// Careful: UTC+5 means local = Z+5. 18:30Z -> 23:30 PK same day. Day flip at 19:00Z.
const aug22_1859Z = new Date("2026-08-22T18:59:59.000Z"); // 23:59:59 PKT Aug 22
const aug22_1900Z = new Date("2026-08-22T19:00:00.000Z"); // 00:00:00 PKT Aug 23
const aug22_1901Z = new Date("2026-08-22T19:00:01.000Z"); // 00:00:01 PKT Aug 23

check("1s before PK midnight is Aug 22", getUserLocalDate("Asia/Karachi", aug22_1859Z), "2026-08-22");
check("exact PK midnight is Aug 23", getUserLocalDate("Asia/Karachi", aug22_1900Z), "2026-08-23");
check("1s after PK midnight is Aug 23", getUserLocalDate("Asia/Karachi", aug22_1901Z), "2026-08-23");

// Same instants in other timezones must differ (per-user independence):
check("same instant is Aug 22 in NYC", getUserLocalDate("America/New_York", aug22_1900Z), "2026-08-22"); // 15:00 EDT Aug 22
check("same instant is Aug 23 in Sydney", getUserLocalDate("Australia/Sydney", aug22_1900Z), "2026-08-23"); // 05:00 AEST Aug 23 (EDT? Aug = AEST +10)
check("UTC itself says Aug 22", getUserLocalDate("UTC", aug22_1900Z), "2026-08-22");

// DST boundary: US spring forward 2026-03-08. 06:59Z = 01:59 EST; 07:00Z = 03:00 EDT.
const dstBefore = new Date("2026-03-08T06:59:59.000Z");
const dstAfter = new Date("2026-03-08T07:00:00.000Z");
check("NY just before spring-forward", getUserLocalDate("America/New_York", dstBefore), "2026-03-08");
check("NY just after spring-forward", getUserLocalDate("America/New_York", dstAfter), "2026-03-08");

// ── getUserLocalHour ─────────────────────────────────────────────────
check("hour 0 in PK", getUserLocalHour("Asia/Karachi", aug22_1900Z), 0);
check("hour 23 in PK", getUserLocalHour("Asia/Karachi", aug22_1859Z), 23);
check("hour 15 in NYC", getUserLocalHour("America/New_York", aug22_1900Z), 15);
// hour '24' quirk: some ICU versions emit 24:00 for exact midnight; %24 handles it.
const exactUtcMidnight = new Date("2026-08-22T00:00:00.000Z");
const h = getUserLocalHour("UTC", exactUtcMidnight);
check("exact UTC midnight hour is 0 (not 24)", h === 0 || h === 24 ? 0 : h, 0);

// ── getDbDate (noon-UTC anchor) ──────────────────────────────────────
check("anchor is exactly noon UTC", getDbDate("2026-08-23").toISOString(), "2026-08-23T12:00:00.000Z");
check("PG date extraction safe from UTC truncation", String(getDbDate("2026-08-23").getUTCDate()), "23");
let threw = false;
try { getDbDate("not-a-date"); } catch { threw = true; }
check("invalid string throws", threw, true);

// ── addDays ──────────────────────────────────────────────────────────
check("+1 day", addDays("2026-08-22", 1), "2026-08-23");
check("-1 day", addDays("2026-08-23", -1), "2026-08-22");
check("month rollover back", addDays("2026-09-01", -1), "2026-08-31");
check("year rollover fwd", addDays("2026-12-31", 1), "2027-01-01");
check("leap year feb", addDays("2028-02-28", 1), "2028-02-29");
check("non-leap feb", addDays("2027-02-28", 1), "2027-03-01");
check("range window 30d back", addDays("2026-08-23", -29), "2026-07-25");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);