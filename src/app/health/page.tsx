"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Footprints, Dumbbell, Droplets, Utensils, BedDouble } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const todayStr = () => new Date().toISOString().split("T")[0];

interface MealRow {
  mealType: string;
  content: string;
}

export default function HealthPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [walkingMins, setWalkingMins] = useState(0);
  const [walkingTarget, setWalkingTarget] = useState(30);
  const [workoutTarget, setWorkoutTarget] = useState(45);
  const [workoutMins, setWorkoutMins] = useState(0);
  const [water, setWater] = useState(0);
  const [waterTarget, setWaterTarget] = useState(8);
  const [meals, setMeals] = useState<Record<string, string>>({});
  const [mealNotes, setMealNotes] = useState<Record<string, string>>({});
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [week, setWeek] = useState<Array<{ date: string; label: string; walk: boolean; work: boolean; waterOk: boolean }> | null>(null);

  const flash = (msg: string) => {
    setSavedFlash(msg);
    setTimeout(() => setSavedFlash(null), 1500);
  };

  const loadWeek = useCallback(async () => {
    try {
      const res = await fetch("/api/history?days=7");
      if (!res.ok) return;
      const data = await res.json();
      if (!data.history) return;
      const byDate = new Map(
        (data.history as Array<{ date: string; walking?: number; exerciseMins?: number; water?: number }>).map((d) => [d.date, d])
      );
      const result: Array<{ date: string; label: string; walk: boolean; work: boolean; waterOk: boolean }> = [];
      for (let i = 6; i >= 0; i--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const ds = dt.toISOString().split("T")[0];
        const d = byDate.get(ds);
        result.push({
          date: ds,
          label: dt.toLocaleDateString("en-US", { weekday: "narrow" }),
          walk: !!d?.walking,
          work: (d?.exerciseMins ?? 0) > 0,
          waterOk: (d?.water ?? 0) >= 8,
        });
      }
      setWeek(result);
    } catch {
      /* non-critical */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, settingsRes] = await Promise.all([
        fetch(`/api/health?date=${todayStr()}`),
        fetch("/api/settings"),
      ]);
      if (!res.ok) throw new Error();
      const data = await res.json();

      setWalkingMins(data.walking?.durationMins ?? 0);
      setWater(data.water?.glasses ?? 0);
      if (data.water?.target) setWaterTarget(data.water.target);
      setWorkoutMins(
        (data.exercise || []).reduce((sum: number, e: { durationMins?: number }) => sum + (e.durationMins || 0), 0)
      );

      const m: Record<string, string> = {};
      const n: Record<string, string> = {};
      for (const meal of (data.meals || []) as MealRow[]) {
        m[meal.mealType] = meal.content;
        n[meal.mealType] = "";
      }
      setMeals(m);
      setMealNotes(n);

      if (data.sleep?.hours != null) setSleepHours(String(data.sleep.hours));
      if (data.sleep?.quality != null) setSleepQuality(String(data.sleep.quality));

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.settings?.walkingTargetMins) setWalkingTarget(s.settings.walkingTargetMins);
        if (s.settings?.workoutTargetMins) setWorkoutTarget(s.settings.workoutTargetMins);
      }
      loadWeek();
    } catch {
      setError("Failed to load today's health data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [loadWeek]);

  useEffect(() => {
    load();
  }, [load]);

  const post = async (type: string, payload: Record<string, unknown>) => {
    setError(null);
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: payload }),
      });
      if (!res.ok) throw new Error(await res.json().then((j) => j.error).catch(() => ""));
      flash(`${type.charAt(0).toUpperCase()}${type.slice(1)} saved`);
      return true;
    } catch (e) {
      setError(e instanceof Error && e.message ? `Could not save ${type}: ${e.message}` : `Could not save ${type}. Try again.`);
      return false;
    }
  };

  const adjustWalking = async (delta: number) => {
    const next = Math.max(0, walkingMins + delta);
    const prev = walkingMins;
    setWalkingMins(next);
    const ok = await post("walking", { durationMins: next });
    if (!ok) setWalkingMins(prev);
    loadWeek();
  };

  const logWorkout = async () => {
    const ok = await post("exercise", { durationMins: 15, completed: true });
    if (ok) {
      setWorkoutMins((m) => m + 15);
      loadWeek();
    }
  };

  const adjustWater = async (delta: number) => {
    const next = Math.max(0, Math.min(50, water + delta));
    const prev = water;
    setWater(next);
    const ok = await post("water", { glasses: next, target: waterTarget });
    if (!ok) setWater(prev);
    loadWeek();
  };

  const saveMeal = async (mealType: string) => {
    const content = (meals[mealType] || "").trim();
    if (!content) return;
    await post("meal", { mealType, content, notes: mealNotes[mealType] || null });
  };

  const saveSleep = async () => {
    const hours = parseFloat(sleepHours);
    const quality = parseInt(sleepQuality);
    if (!Number.isFinite(hours) || hours <= 0 || hours >= 24) {
      setError("Sleep hours must be between 0 and 24.");
      return;
    }
    await post("sleep", {
      hours,
      quality: Number.isInteger(quality) && quality >= 1 && quality <= 5 ? quality : null,
    });
  };

  const mealField = (mealType: string, label: string, placeholder: string) => (
    <div className="space-y-2">
      <label htmlFor={`meal-${mealType.toLowerCase()}`} className="text-xs text-zinc-500 uppercase tracking-wider">{label}</label>
      <Input
        id={`meal-${mealType.toLowerCase()}`}
        value={meals[mealType] || ""}
        onChange={(e) => setMeals({ ...meals, [mealType]: e.target.value })}
        onBlur={() => saveMeal(mealType)}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        placeholder={placeholder}
      />
    </div>
  );

  const weekCell = (ok: boolean, label: string) => (
    <div
      className={`h-8 rounded flex items-center justify-center text-[10px] ${
        ok ? "bg-emerald-900/40 text-emerald-400" : "bg-zinc-800 text-zinc-600"
      }`}
    >
      {label}
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Health & Fitness</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Sustainable habits for a healthier life
              {savedFlash ? <span className="ml-2 text-emerald-400">· {savedFlash} ✓</span> : null}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-5">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-800" />
                  <div className="h-5 w-24 animate-pulse rounded bg-zinc-800/70" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-zinc-800/70" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                      <Footprints className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Walking</p>
                      <p className="text-lg font-bold text-white">{walkingMins}/{walkingTarget} min</p>
                    </div>
                  </div>
                  <Progress value={Math.min(100, Math.round((walkingMins / walkingTarget) * 100))} variant="success" />
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" disabled={walkingMins === 0} onClick={() => adjustWalking(-5)}>-5</Button>
                    <Button variant="outline" size="sm" onClick={() => adjustWalking(5)}>+5</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-900/50 flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Workout</p>
                      <p className="text-lg font-bold text-white">{workoutMins}/{workoutTarget} min today</p>
                    </div>
                  </div>
                  <Progress value={Math.min(100, Math.round((workoutMins / workoutTarget) * 100))} variant={workoutMins > 0 ? "success" : "default"} />
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={logWorkout}>Log +15 min session</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-900/50 flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Water</p>
                      <p className="text-lg font-bold text-white">{water}/{waterTarget} glasses</p>
                    </div>
                  </div>
                  <Progress value={Math.min(100, Math.round((water / waterTarget) * 100))} />
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" disabled={water === 0} onClick={() => adjustWater(-1)}>-1</Button>
                    <Button variant="outline" size="sm" onClick={() => adjustWater(1)}>+1</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-900/50 flex items-center justify-center">
                      <BedDouble className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Last Night&apos;s Sleep</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      max="24"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="Hours"
                      aria-label="Hours of sleep"
                      className="w-24"
                    />
                    <Select
                      options={[
                        { value: "", label: "Quality…" },
                        { value: "1", label: "1 · Poor" },
                        { value: "2", label: "2 · Fair" },
                        { value: "3", label: "3 · OK" },
                        { value: "4", label: "4 · Good" },
                        { value: "5", label: "5 · Great" },
                      ]}
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(e.target.value)}
                      aria-label="Sleep quality"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" onClick={saveSleep}>Save Sleep</Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-zinc-500" />
                    Today&apos;s Meals
                    <span className="text-xs font-normal text-zinc-600">(auto-saves when you leave a field)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mealField("BREAKFAST", "Breakfast (~8:00 AM)", "e.g., Roti + Salan + Tea")}
                  {mealField("LUNCH", "Lunch (~12:00 PM)", "e.g., Roti + Salan + Salad")}
                  {mealField("SNACK", "Snack (Optional)", "e.g., Fruit, Nuts")}
                  {mealField("DINNER", "Dinner (~7:00 PM)", "e.g., Roti + Salan")}
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Notes (saved with next meal)</label>
                    <Textarea value={mealNotes.DINNER || ""} onChange={(e) => setMealNotes({ ...mealNotes, DINNER: e.target.value })} placeholder="How did you feel? Any changes?" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  {!week ? (
                    <p className="text-sm text-zinc-500">No history yet.</p>
                  ) : week.every((d) => !d.walk && !d.work && !d.waterOk) ? (
                    <p className="text-sm text-zinc-500">Log activity to build your weekly consistency view.</p>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {week.map((d) => (
                        <div key={d.date} className="text-center space-y-2">
                          <div className="text-xs text-zinc-500">{d.label}</div>
                          <div className="space-y-1">
                            {weekCell(d.walk, "Walk")}
                            {weekCell(d.work, "Work")}
                            {weekCell(d.waterOk, "Water")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}