import { PrayerTimes, CalculationMethod as CM, Madhab as M, Coordinates, CalculationParameters, SunnahTimes } from "adhan";

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
}

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

export function getPrayerTimesForDate(
  date: Date,
  config: LocationConfig
): PrayerTimeEntry[] {
  const params = getCalculationMethod(config.method);
  params.madhab = getMadhab(config.madhab);

  const prayerTimes = new PrayerTimes(
    new Coordinates(config.latitude, config.longitude),
    date,
    params
  );

  const format = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return [
    { name: "Fajr", time: prayerTimes.fajr, formatted: format(prayerTimes.fajr) },
    { name: "Sunrise", time: prayerTimes.sunrise, formatted: format(prayerTimes.sunrise) },
    { name: "Dhuhr", time: prayerTimes.dhuhr, formatted: format(prayerTimes.dhuhr) },
    { name: "Asr", time: prayerTimes.asr, formatted: format(prayerTimes.asr) },
    { name: "Maghrib", time: prayerTimes.maghrib, formatted: format(prayerTimes.maghrib) },
    { name: "Isha", time: prayerTimes.isha, formatted: format(prayerTimes.isha) },
  ];
}

export function getNextPrayer(
  config: LocationConfig
): { name: string; time: string; remaining: string } | null {
  const now = new Date();
  const prayers = getPrayerTimesForDate(now, config);

  for (const prayer of prayers) {
    if (prayer.name === "Sunrise") continue;
    if (prayer.time > now) {
      const diff = prayer.time.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        name: prayer.name,
        time: prayer.formatted,
        remaining:
          hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`,
      };
    }
  }
  return null;
}

export function getSunnahTimes(
  date: Date,
  config: LocationConfig
): { middleOfNight: string; lastThird: string } {
  const params = getCalculationMethod(config.method);
  params.madhab = getMadhab(config.madhab);

  const prayerTimes = new PrayerTimes(
    new Coordinates(config.latitude, config.longitude),
    date,
    params
  );

  const sunnah = new SunnahTimes(prayerTimes);
  const format = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return {
    middleOfNight: format(sunnah.middleOfTheNight),
    lastThird: format(sunnah.lastThirdOfTheNight),
  };
}
