import { getPrayerTimesForDate } from "../src/lib/prayer-times";

const config = {
  latitude: 33.6844,
  longitude: 73.0479,
  method: "Karachi",
  madhab: "Hanafi",
  timezone: "Asia/Karachi",
};

const NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

function to24h(formatted: string): string {
  const m = formatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return "?";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

async function fetchReference(dateStr: string) {
  const [y, mo, d] = dateStr.split("-");
  const url = `https://api.aladhan.com/v1/timings/${d}-${mo}-${y}?latitude=${config.latitude}&longitude=${config.longitude}&method=1&school=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`aladhan ${res.status}`);
  const json = await res.json();
  return json.data.timings as Record<string, string>;
}

async function main() {
  console.log(`Config: Islamabad (${config.latitude},${config.longitude}) | Karachi Univ method | Hanafi Asr | ${config.timezone}\n`);
  let worst = 0;
  for (const ds of ["2026-08-23", "2026-08-24", "2026-08-25"]) {
    const ref = await fetchReference(ds);
    const app = getPrayerTimesForDate(new Date(`${ds}T12:00:00Z`), config);
    console.log(`── ${ds} ──`);
    for (const n of NAMES) {
      const appT = to24h(app.find((p) => p.name === n)!.formatted);
      const refT = ref[n].slice(0, 5);
      const diff =
        Math.abs(
          (parseInt(appT.slice(0, 2), 10) * 60 + parseInt(appT.slice(3), 10)) -
            (parseInt(refT.slice(0, 2), 10) * 60 + parseInt(refT.slice(3), 10))
        );
      worst = Math.max(worst, diff);
      const flag = diff === 0 ? "OK " : diff <= 2 ? "~  " : "DIFF";
      console.log(`${flag} ${n.padEnd(8)} app=${appT}  ref=${refT}  Δ=${diff}min`);
    }
    console.log();
  }
  console.log(`MAX DIFF: ${worst} minutes`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
