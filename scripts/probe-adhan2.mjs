const { PrayerTimes, CalculationMethod, Madhab, Coordinates } = require("adhan");

console.log("TZ offset (min):", new Date().getTimezoneOffset());
console.log("resolved tz:", Intl.DateTimeFormat().resolvedOptions().timeZone);

const params = CalculationMethod.Karachi();
params.madhab = Madhab.Hanafi;
const coords = new Coordinates(33.6844, 73.0479);
const pt = new PrayerTimes(coords, new Date(), params);
console.log("today via new Date():");
for (const [k, v] of Object.entries({ fajr: pt.fajr, dhuhr: pt.dhuhr, maghrib: pt.maghrib })) {
  console.log(
    k,
    "| ISO:", v.toISOString(),
    "| UTC-read:", `${v.getUTCHours()}:${String(v.getUTCMinutes()).padStart(2, "0")}`,
    "| LOC-read:", `${v.getHours()}:${String(v.getMinutes()).padStart(2, "0")}`
  );
}

const d = new Date(Date.UTC(2026, 7, 24, 0, 0));
const pt2 = new PrayerTimes(coords, d, params);
console.log("\nanchor = Date.UTC(2026,7,24,0):");
console.log("anchor ISO:", d.toISOString(), "| loc y/m/d:", `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`);
for (const [k, v] of Object.entries({ fajr: pt2.fajr, dhuhr: pt2.dhuhr, maghrib: pt2.maghrib })) {
  console.log(
    k,
    "| ISO:", v.toISOString(),
    "| UTC-read:", `${v.getUTCHours()}:${String(v.getUTCMinutes()).padStart(2, "0")}`,
    "| LOC-read:", `${v.getHours()}:${String(v.getMinutes()).padStart(2, "0")}`
  );
}
