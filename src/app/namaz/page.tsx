"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Settings2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface PrayerTime {
  name: string;
  dbKey?: string;
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

export default function NamazPage() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState("");
  const [method, setMethod] = useState("Karachi");
  const [madhab, setMadhab] = useState("Hanafi");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [week, setWeek] = useState<Array<{ date: string; label: string; completed: number }> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [timesRes, recordsRes, settingsRes, historyRes] = await Promise.all([
        fetch("/api/prayers"),
        fetch(`/api/prayers/record?date=${todayStr()}`),
        fetch("/api/settings"),
        fetch("/api/history?days=7"),
      ]);
      if (!timesRes.ok) throw new Error("Could not load prayer times");
      const timesData = await timesRes.json();
      const recordsData = recordsRes.ok ? await recordsRes.json() : { records: [] };
      const settingsData = settingsRes.ok ? await settingsRes.json() : null;
      const historyData = historyRes.ok ? await historyRes.json() : null;

      const statusByName = new Map<string, string>();
      for (const r of recordsData.prayers || []) {
        if (r.prayer && r.status) statusByName.set(r.prayer, r.status);
      }

      setPrayers(
        (timesData.prayers || []).map((p: { name: string; formatted?: string; time?: Date }) => ({
          name: p.name,
          dbKey: p.name.toUpperCase(),
          formatted: p.formatted,
          time: p.time,
          status:
            (statusByName.get(p.name.toUpperCase()) as PrayerTime["status"]) ||
            ("pending" as const),
        }))
      );

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
      setError("Failed to load namaz data. Please refresh.");
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
    const next =
      current.status === "COMPLETED"
        ? "MISSED"
        : current.status === "MISSED"
        ? "PARTIAL"
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
      setError(`Could not save ${name}. Try again.`);
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
        body: JSON.stringify({
          location,
          prayerCalcMethod: method,
          juristicMethod: madhab,
        }),
      });
      if (!res.ok) throw new Error();
      setSavedMsg("Saved");
      setTimeout(() => setSavedMsg(null), 2000);
    } catch {
      setError("Could not save settings.");
    } finally {
      setSaving(null);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "MISSED":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Circle className="h-5 w-5 text-zinc-600" />;
    }
  };

  const completedCount = prayers.filter((p) => p.status === "COMPLETED").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Namaz</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {loading ? "Loading…" : `${completedCount} of 5 prayers recorded today`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={saveSettings} disabled={saving === "settings"}>
            <Settings2 className="h-4 w-4 mr-2" />
            {saving === "settings" ? "Saving…" : savedMsg || "Save Settings"}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <>
                {PRAYER_NAMES.map((n) => (
                  <Card key={n}>
                    <CardContent className="p-4 text-sm text-zinc-600">{n}…</CardContent>
                  </Card>
                ))}
              </>
            ) : prayers.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-zinc-500">
                  No prayer times available. Check your location settings.
                </CardContent>
              </Card>
            ) : (
              prayers.map((prayer) => (
                <Card
                  key={prayer.name}
                  className={
                    prayer.status === "COMPLETED"
                      ? "border-emerald-900/30"
                      : prayer.status === "MISSED"
                      ? "border-red-900/30"
                      : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {statusIcon(prayer.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-white">{prayer.name}</h3>
                          <p className="text-sm text-zinc-500">{prayer.formatted || prayer.time}</p>
                        </div>
                      </div>
                      <Button
                        variant={prayer.status === "COMPLETED" ? "default" : "outline"}
                        size="sm"
                        disabled={saving === prayer.name}
                        onClick={() => togglePrayer(prayer.name)}
                      >
                        {saving === prayer.name
                          ? "Saving…"
                          : prayer.status === "COMPLETED"
                          ? "Completed ✓"
                          : prayer.status === "MISSED"
                          ? "Missed — mark partial"
                          : prayer.status === "PARTIAL"
                          ? "Partial — mark complete"
                          : "Mark Complete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  Location & Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Calculation Method</label>
                  <Select options={calculationMethods} value={method} onChange={(e) => setMethod(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Juristic Method</label>
                  <Select options={juristicMethods} value={madhab} onChange={(e) => setMadhab(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!week ? (
                  <p className="text-sm text-zinc-500">No history yet.</p>
                ) : week.every((d) => d.completed === 0) ? (
                  <p className="text-sm text-zinc-500">Record prayers to build your weekly overview.</p>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {week.map((d) => (
                      <div
                        key={d.date}
                        className={`text-center p-1.5 rounded-lg text-xs ${
                          d.completed >= 5
                            ? "bg-emerald-900/30 text-emerald-400"
                            : d.completed > 0
                            ? "bg-yellow-900/20 text-yellow-500"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        <div className="font-medium">{d.label}</div>
                        <div className="mt-1">{d.completed > 0 ? `${d.completed}/5` : "-"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}