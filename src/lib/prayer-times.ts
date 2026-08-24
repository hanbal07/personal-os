import { PrayerTimes, CalculationMethod as CM, Madhab as M, Coordinates, CalculationParameters } from "adhan";

export interface PrayerTimeEntry {
  name: string;
  time: Date;
  formatted: string;
}

export interface LocationConfig {
  latitude: number;
  longitude: number;
  method: string;
  madhab: string;
  /** IANA timezone used for day anchoring and display (e.g. "Asia/Karachi") */
  timezone?: string;
}

interface ZonedParts {
  y: number;
  m: number;
  d: number;
}

const EVENT_NAMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

function getCalculationMethod(method: string): CalculationParameters {
  const methods: Record<string, () => CalculationParameters> = {
    "Karachi": CM.Karachi,
    "MWL": CM.MuslimWorldLeague,
    "ISNA": CM.NorthAmerica,
    "Egypt": CM.Egyptian,
    "Makkah": CM.UmmAlQura,
    "Tehran": CM.Tehran,
  };
  const factory = methods[method] || CM.Karachi;
  return factory();
}

function getMadhab(madhab: string): typeof M.Hanafi | typeof M.Shafi {
  return madhab === "Shafi" ? M.Shafi : M.Hanafi;
}

/**
 * Offset (minutes) a timezone is ahead of UTC at a given instant. DST-safe:
 * recomputed for the actual instant rather than assumed fixed.
 */
function tzOffsetMinutes(tz: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(instant)) {
    if (p.type !== "literal") parts[p.type] = parseInt(p.value, 10);
  }
  const asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUTC - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

/** Calendar parts of an instant viewed in the given timezone. */
function zonedParts(tz: string, instant: Date): ZonedParts & { h: number; min: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(instant)) {
    if (p.type !== "literal") parts[p.type] = parseInt(p.value, 10);
  }
  return { y: parts.year, m: parts.month, d: parts.day, h: parts.hour, min: parts.minute };
}

/**
 * Convert wall-clock (y, m, d, h, min) in `tz` to a real UTC instant.
 * Two-pass offset resolution handles DST boundaries correctly.
 */
function wallClockToInstant(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
  tz: string
): Date {
  const guess = Date.UTC(y, m - 1, d, h, min, 0, 0);
  const off1 = tzOffsetMinutes(tz, new Date(guess));
  const inst1 = new Date(guess - off1 * 60000);
  const off2 = tzOffsetMinutes(tz, inst1);
  if (off1 === off2) return inst1;
  return new Date(guess - off2 * 60000);
}

function formatInZone(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}

/**
 * Solar events for the calendar day containing `date` (viewed in config.timezone),
 * returned as true UTC instants plus timezone-formatted strings.
 *
 * The adhan library reports times through the environment's local clock; we read
 * those wall-clock components and re-anchor them to the configured timezone so
 * results never depend on the server's own TZ setting.
 */
function computeSolarEvents(date: Date, config: LocationConfig) {
  const tz = config.timezone || "UTC";
  const params = getCalculationMethod(config.method);
  params.madhab = getMadhab(config.madhab);

  // Anchor to noon UTC of the target calendar day in the user's timezone so
  // the date components are unambiguous even for early-morning requests.
  const target = zonedParts(tz, date);
  const anchor = new Date(Date.UTC(target.y, target.m - 1, target.d, 12, 0, 0, 0));

  const pt = new PrayerTimes(new Coordinates(config.latitude, config.longitude), anchor, params);

  const raw: Record<string, Date> = {
    Fajr: pt.fajr,
    Sunrise: pt.sunrise,
    Dhuhr: pt.dhuhr,
    Asr: pt.asr,
    Maghrib: pt.maghrib,
    Isha: pt.isha,
  };

  return EVENT_NAMES.map((name) => {
    // adhan encodes the solar clock time in the environment-local fields.
    const h = raw[name].getHours();
    const min = raw[name].getMinutes();
    const instant = wallClockToInstant(target.y, target.m - 1, target.d, h, min, tz);
    return { name, instant, formatted: formatInZone(instant, tz) };
  });
}

export function getPrayerTimesForDate(date: Date, config: LocationConfig): PrayerTimeEntry[] {
  return computeSolarEvents(date, config).map(({ name, instant, formatted }) => ({
    name,
    time: instant,
    formatted,
  }));
}

export function getNextPrayer(
  config: LocationConfig
): { name: string; time: string; remaining: string } | null {
  const now = new Date();

  const buildDay = (dayOffset: number) => {
    const base = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return computeSolarEvents(base, config).filter(({ name }) => name !== "Sunrise");
  };

  // Today's remaining prayers first; wraps past Isha to tomorrow's Fajr.
  const candidates = [...buildDay(0), ...buildDay(1)];

  for (const ev of candidates) {
    if (ev.instant > now) {
      const diff = ev.instant.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        name: ev.name,
        time: ev.formatted,
        remaining: hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`,
      };
    }
  }
  return null;
}

