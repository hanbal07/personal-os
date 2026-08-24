"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Footprints, Dumbbell, Droplets, Utensils, BedDouble, Scale } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const todayStr = () => new Date().toISOString().split("T")[0];

interface MealRow {
  mealType: string;
  content: string;
}

interface WeightEntryRow {
  date: string;
  weightKg: number;
  note?: string | null;
}

interface WeightData {
  entries: WeightEntryRow[];
  startWeightKg: number | null;
  goalWeightKg: number | null;
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
  const [weight, setWeight] = useState<WeightData>({ entries: [], startWeightKg: null, goalWeightKg: null });
  const [weightInput, setWeightInput] = useState("");
  const [goalInput, setGoalInput] = useState("");

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
      const [res, settingsRes, weightRes] = await Promise.all([
        fetch(`/api/health?date=${todayStr()}`),
        fetch("/api/settings"),
        fetch("/api/weight"),
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
      if (weightRes.ok) {
        const w = await weightRes.json();
        const wd: WeightData = {
          entries: (w.entries ?? []) as WeightEntryRow[],
          startWeightKg: w.startWeightKg ?? null,
          goalWeightKg: w.goalWeightKg ?? null,
        };
        setWeight(wd);
        const latest = wd.entries[wd.entries.length - 1];
        if (latest) setWeightInput(String(latest.weightKg));
        if (wd.goalWeightKg != null) setGoalInput(String(wd.goalWeightKg));
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

  const saveWeight = async () => {
    const kg = parseFloat(weightInput);
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
      setError("Weight must be between 20 and 400 kg.");
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: kg }),
      });
      if (!res.ok) throw new Error(await res.json().then((j) => j.error).catch(() => ""));
      const w = await res.json();
      setWeight((prev) => {
        const entries = [...prev.entries.filter((e) => e.date !== w.entry.date), w.entry].sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        return {
          entries,
          startWeightKg: w.startWeightKg ?? prev.startWeightKg,
          goalWeightKg: prev.goalWeightKg,
        };
      });
      const goalNum = parseFloat(goalInput);
      if (Number.isFinite(goalNum) && goalNum >= 20 && goalNum <= 400 && goalNum !== w.goalWeightKg) {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalWeightKg: goalNum }),
        });
        setWeight((prev) => ({ ...prev, goalWeightKg: goalNum }));
      }
      flash("Weight saved");
    } catch (e) {
      setError(e instanceof Error && e.message ? `Could not save weight: ${e.message}` : "Could not save weight. Try again.");
    }
  };

  const mealField = (mealType: string, label: string, placeholder: string) => (
    <div className="space-y-2">
      <label htmlFor={`meal-${mealType.toLowerCase()}`} className="text-xs text-muted uppercase tracking-wider">{label}</label>
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
        ok ? "bg-success-tint text-success" : "bg-surface2 text-faint"
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
            <h1 className="text-2xl font-bold text-ink">Health & Fitness</h1>
            <p className="text-sm text-muted mt-1">
              Sustainable habits for a healthier life
              {savedFlash ? <span className="ml-2 text-success">· {savedFlash} ✓</span> : null}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-5">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-surface2" />
                  <div className="h-5 w-24 animate-pulse rounded bg-surface2/70" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-surface2/70" />
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
                    <div className="h-10 w-10 rounded-lg bg-accent-tint flex items-center justify-center">
                      <Footprints className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Walking</p>
                      <p className="text-lg font-bold text-ink">{walkingMins}/{walkingTarget} min</p>
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
                    <div className="h-10 w-10 rounded-lg bg-warning-tint flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Workout</p>
                      <p className="text-lg font-bold text-ink">{workoutMins}/{workoutTarget} min today</p>
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
                    <div className="h-10 w-10 rounded-lg bg-accent-tint flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Water</p>
                      <p className="text-lg font-bold text-ink">{water}/{waterTarget} glasses</p>
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
                    <div className="h-10 w-10 rounded-lg bg-faith-tint flex items-center justify-center">
                      <BedDouble className="h-5 w-5 text-faith" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Last Night&apos;s Sleep</p>
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

            <WeightCard
              weight={weight}
              weightInput={weightInput}
              goalInput={goalInput}
              onWeightInput={setWeightInput}
              onGoalInput={setGoalInput}
              onSave={saveWeight}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted" />
                    Today&apos;s Meals
                    <span className="text-xs font-normal text-faint">(auto-saves when you leave a field)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mealField("BREAKFAST", "Breakfast (~8:00 AM)", "e.g., Roti + Salan + Tea")}
                  {mealField("LUNCH", "Lunch (~12:00 PM)", "e.g., Roti + Salan + Salad")}
                  {mealField("SNACK", "Snack (Optional)", "e.g., Fruit, Nuts")}
                  {mealField("DINNER", "Dinner (~7:00 PM)", "e.g., Roti + Salan")}
                  <div className="space-y-2">
                    <label className="text-xs text-muted uppercase tracking-wider">Notes (saved with next meal)</label>
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
                    <p className="text-sm text-muted">No history yet.</p>
                  ) : week.every((d) => !d.walk && !d.work && !d.waterOk) ? (
                    <p className="text-sm text-muted">Log activity to build your weekly consistency view.</p>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {week.map((d) => (
                        <div key={d.date} className="text-center space-y-2">
                          <div className="text-xs text-muted">{d.label}</div>
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

function WeightCard({
  weight,
  weightInput,
  goalInput,
  onWeightInput,
  onGoalInput,
  onSave,
}: {
  weight: WeightData;
  weightInput: string;
  goalInput: string;
  onWeightInput: (v: string) => void;
  onGoalInput: (v: string) => void;
  onSave: () => void;
}) {
  const { entries, startWeightKg, goalWeightKg } = weight;
  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  const changeFromStart =
    latest && startWeightKg != null ? +(latest.weightKg - startWeightKg).toFixed(1) : null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const baseline =
    entries.find((e) => e.date >= weekAgoStr && e.weightKg !== latest?.weightKg) ?? null;
  const weeklyTrend = latest && baseline ? +(latest.weightKg - baseline.weightKg).toFixed(1) : null;

  let progressPct: number | null = null;
  if (latest && startWeightKg != null && goalWeightKg != null) {
    const total = Math.abs(goalWeightKg - startWeightKg);
    if (total >= 0.1) {
      progressPct = Math.max(0, Math.min(100, Math.round(((latest.weightKg - startWeightKg) / (goalWeightKg - startWeightKg)) * 100)));
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fmtKg = (n: number) => `${n.toFixed(1)} kg`;
  const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)} kg`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted" aria-hidden="true" />
          Weight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!latest ? (
          <>
            <p className="text-sm text-muted">
              No weight logged yet. Log your first entry to start tracking — nothing is assumed or estimated.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <label htmlFor="weight-first" className="text-xs text-muted uppercase tracking-wider">
                  Today&apos;s weight (kg)
                </label>
                <Input
                  id="weight-first"
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  value={weightInput}
                  onChange={(e) => onWeightInput(e.target.value)}
                  placeholder="e.g., 72.5"
                  className="w-32"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="goal-first" className="text-xs text-muted uppercase tracking-wider">
                  Goal kg (optional)
                </label>
                <Input
                  id="goal-first"
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  value={goalInput}
                  onChange={(e) => onGoalInput(e.target.value)}
                  placeholder="e.g., 70"
                  className="w-32"
                />
              </div>
              <Button variant="outline" size="sm" onClick={onSave}>
                Save entry
              </Button>
            </div>
          </>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Current" value={fmtKg(latest.weightKg)} sub={`Logged ${fmtDate(latest.date)}`} />
              <Stat label="Starting" value={startWeightKg != null ? fmtKg(startWeightKg) : "—"} />
              <Stat label="Goal" value={goalWeightKg != null ? fmtKg(goalWeightKg) : "Not set"} />
              <Stat
                label="Change"
                value={changeFromStart != null && changeFromStart !== 0 ? signed(changeFromStart) : "—"}
                sub={changeFromStart === 0 ? "No change yet" : undefined}
              />
            </dl>

            {progressPct != null && (
              <div>
                <div className="flex items-baseline justify-between text-xs text-muted">
                  <span>Progress toward goal</span>
                  <span className="font-semibold text-ink">{progressPct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            <p className="text-xs text-muted">
              {weeklyTrend != null && weeklyTrend !== 0
                ? `${signed(weeklyTrend)} since ${fmtDate(baseline!.date)}.`
                : entries.length > 1
                ? `No change across your recent logs (${entries.length} entries).`
                : "Log again in a few days to see a trend."}
            </p>

            <div className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
              <div className="space-y-1">
                <label htmlFor="weight-update" className="text-xs text-muted uppercase tracking-wider">
                  Update weight (kg)
                </label>
                <Input
                  id="weight-update"
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  value={weightInput}
                  onChange={(e) => onWeightInput(e.target.value)}
                  className="w-28"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="goal-update" className="text-xs text-muted uppercase tracking-wider">
                  Goal kg
                </label>
                <Input
                  id="goal-update"
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  value={goalInput}
                  onChange={(e) => onGoalInput(e.target.value)}
                  placeholder="Not set"
                  className="w-28"
                />
              </div>
              <Button variant="outline" size="sm" onClick={onSave}>
                Save today&apos;s weight
              </Button>
            </div>

            {entries.length > 1 && (
              <ul className="space-y-1 border-t border-line pt-3" aria-label="Weight history">
                {[...entries]
                  .slice(-8)
                  .reverse()
                  .map((e, i, arr) => {
                    const prev = arr[i + 1];
                    const delta = prev ? +(e.weightKg - prev.weightKg).toFixed(1) : null;
                    return (
                      <li key={e.date} className="flex items-baseline justify-between text-sm">
                        <span className="text-muted">{fmtDate(e.date)}</span>
                        <span className="font-medium text-ink">
                          {fmtKg(e.weightKg)}
                          {delta != null && delta !== 0 && (
                            <span className="ml-2 text-xs font-normal text-faint">{signed(delta)}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold text-ink">{value}</dd>
      {sub && <p className="text-[11px] text-faint">{sub}</p>}
    </div>
  );
}