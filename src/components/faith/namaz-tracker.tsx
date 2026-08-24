"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, AlertCircle, Clock, MapPin, Settings2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface PrayerTime {
  name: string;
  formatted?: string;
  time?: string;
  status: "COMPLETED" | "MISSED" | "PARTIAL" | "upcoming" | "pending";
}

const calculationMethods = [
  { value: "Karachi", label: "Karachi (University of Islamic Sciences)" },
  { value: "MWL", label: "Muslim World League" },
  { value: "ISNA", label: "ISNA (North America)" },
  { value: "Egypt", label: "Egyptian General Authority" },
  { value: "Makkah", label: "Umm Al-Qura University" },
];

const juristicMethods = [
  { value: "Hanafi", label: "Hanafi" },
  { value: "Shafi", label: "Shafi'i / Maliki / Hanbali" },
];

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const todayStr = () => new Date().toISOString().split("T")[0];

export function NamazTracker({ compact = false }: { compact?: boolean }) {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");

  const [location, setLocation] = useState("");
  const [method, setMethod] = useState("Karachi");
  const [madhab, setMadhab] = useState("Hanafi");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [week, setWeek] = useState<Array<{ date: string; label: string; completed: number }> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [timesRes, recordsRes, settingsRes, historyRes] = await Promise.all([
        fetch("/api/prayers"),
        fetch(`/api/prayers/record?date=${todayStr()}`),
        fetch("/api/settings"),
        fetch("/api/history?days=7"),
      ]);
      if (!timesRes.ok) throw new Error();
      const timesData = await timesRes.json();
      const recordsData = recordsRes.ok ? await recordsRes.json() : { prayers: [] };
      const settingsData = settingsRes.ok ? await settingsRes.json() : null;
      const historyData = historyRes.ok ? await historyRes.json() : null;

      const statusByName = new Map<string, string>();
      for (const r of recordsData.prayers || []) {
        if (r.prayer && r.status) statusByName.set(r.prayer, r.status);
      }

      setPrayers(
        (timesData.prayers || []).map((p: { name: string; formatted?: string }) => ({
          name: p.name,
          formatted: p.formatted,
          status:
            (statusByName.get(p.name.toUpperCase()) as PrayerTime["status"]) ||
            ("pending" as const),
        }))
      );
      if (timesData.location?.label) setLocationLabel(timesData.location.label);

      if (settingsData?.settings) {
        setLocation(settingsData.settings.location || "");
        setMethod(settingsData.settings.prayerCalcMethod || "Karachi");
        setMadhab(settingsData.settings.juristicMethod || "Hanafi");
      }

      if (historyData?.history) {
        const days = historyData.history.map((d: { date: string; prayersCompleted: number }) => {
          const dt = new Date(`${d.date}T12:00:00`);
          return {
            date: d.date,
            label: dt.toLocaleDateString("en-US", { weekday: "narrow" }),
            completed: d.prayersCompleted ?? 0,
          };
        });
        const byDate = new Map<string, { date: string; label: string; completed: number }>(
          days.map((d: { date: string }) => [d.date, d])
        );
        const result: Array<{ date: string; label: string; completed: number }> = [];
        for (let i = 6; i >= 0; i--) {
          const dt = new Date();
          dt.setDate(dt.getDate() - i);
          const ds = dt.toISOString().split("T")[0];
          const fallback = {
            date: ds,
            label: dt.toLocaleDateString("en-US", { weekday: "narrow" }),
            completed: 0,
          };
          result.push(byDate.get(ds) ?? fallback);
        }
        setWeek(result);
      }
    } catch {
      setError("Couldn't load prayer data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const togglePrayer = async (name: string) => {
    const current = prayers.find((p) => p.name === name);
    if (!current || saving) return;
    // Gentle cycle: accidental taps degrade one step instead of jumping to MISSED.
    const next =
      current.status === "COMPLETED"
        ? "PARTIAL"
        : current.status === "PARTIAL"
        ? "MISSED"
        : "COMPLETED";

    setSaving(name);
    setError(null);
    const prev = prayers;
    setPrayers((p) => p.map((x) => (x.name === name ? { ...x, status: next } : x)));

    try {
      const res = await fetch("/api/prayers/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr(), prayer: name.toUpperCase(), status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPrayers(prev);
      setError(`Couldn't save ${name}. Try again.`);
    } finally {
      setSaving(null);
    }
  };

  const saveSettings = async () => {
    setSaving("settings");
    setSavedMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, prayerCalcMethod: method, juristicMethod: madhab }),
      });
      if (!res.ok) throw new Error();
      setSavedMsg("Saved");
      setTimeout(() => setSavedMsg(null), 2000);
    } catch {
      setError("Couldn't save settings.");
    } finally {
      setSaving(null);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "MISSED":
        return <AlertCircle className="h-5 w-5 text-error" />;
      case "PARTIAL":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Circle className="h-5 w-5 text-line" />;
    }
  };

  const completedCount = prayers.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className={compact ? "space-y-4" : "grid grid-cols-1 gap-6 lg:grid-cols-3"}>
      <div className={compact ? "" : "lg:col-span-2 space-y-3"}>
        {!compact && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {loading ? "…" : `${completedCount} of 5 recorded today`}
            </p>
            {locationLabel && !loading && (
              <p className="text-xs text-faint">
                Times for {locationLabel} · calculated live
              </p>
            )}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {loading ? (
          PRAYER_NAMES.map((n) => (
            <Card key={n}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="ml-auto h-9 w-36 rounded-md" />
              </CardContent>
            </Card>
          ))
        ) : prayers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted">
              No prayer times available. Check your location in Settings below.
            </CardContent>
          </Card>
        ) : (
          prayers.map((prayer) => (
            <Card
              key={prayer.name}
              className={
                prayer.status === "COMPLETED"
                  ? "border-success/30 bg-success-tint/40"
                  : prayer.status === "MISSED"
                  ? "border-error/25"
                  : ""
              }
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <StatusIcon status={prayer.status} />
                  <div>
                    <h3 className="text-base font-semibold text-ink">{prayer.name}</h3>
                    <p className="text-sm text-muted">{prayer.formatted}</p>
                  </div>
                </div>
                <Button
                  variant={prayer.status === "COMPLETED" ? "secondary" : "default"}
                  size="sm"
                  disabled={saving === prayer.name}
                  onClick={() => togglePrayer(prayer.name)}
                  aria-label={`${prayer.status === "COMPLETED" ? "Completed" : prayer.status === "MISSED" ? "Missed" : prayer.status === "PARTIAL" ? "Partial" : "Not recorded"} — tap to change`}
                >
                  {saving === prayer.name
                    ? "Saving…"
                    : prayer.status === "COMPLETED"
                    ? "Done ✓ (tap: Partial)"
                    : prayer.status === "MISSED"
                    ? "Missed — mark complete"
                    : prayer.status === "PARTIAL"
                    ? "Partial — tap for Missed"
                    : "Mark Complete"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-faint" />
              Location &amp; Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="namaz-location" className="text-xs uppercase tracking-wider text-muted">Location</label>
              <Input id="namaz-location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="namaz-method" className="text-xs uppercase tracking-wider text-muted">Calculation Method</label>
              <Select id="namaz-method" options={calculationMethods} value={method} onChange={(e) => setMethod(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="namaz-madhab" className="text-xs uppercase tracking-wider text-muted">Juristic Method</label>
              <Select id="namaz-madhab" options={juristicMethods} value={madhab} onChange={(e) => setMadhab(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={saveSettings} disabled={saving === "settings"} className="w-full">
              <Settings2 className={`mr-2 h-4 w-4 ${saving === "settings" ? "animate-pulse" : ""}`} />
              {saving === "settings" ? "Saving…" : savedMsg || "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-faint" />
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!week ? (
              <p className="text-sm text-muted">No history yet.</p>
            ) : week.every((d) => d.completed === 0) ? (
              <p className="text-sm text-muted">Record prayers to build your weekly overview.</p>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {week.map((d) => (
                  <div
                    key={d.date}
                    className={`rounded-lg p-1.5 text-center text-xs ${
                      d.completed >= 5
                        ? "bg-success-tint text-success font-semibold"
                        : d.completed > 0
                        ? "bg-warning-tint text-warning font-medium"
                        : "bg-surface2 text-faint"
                    }`}
                  >
                    <div>{d.label}</div>
                    <div className="mt-1">{d.completed > 0 ? `${d.completed}/5` : "–"}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!compact && (
          <p className="px-1 text-xs leading-relaxed text-faint">
            Tap once to record as complete. Tap again to step back through partial and missed — nothing is ever lost by accident.
          </p>
        )}
        {compact && <Badge variant="outline">{completedCount}/5 recorded</Badge>}
      </div>
    </div>
  );
}
