"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clock, RefreshCw, StickyNote, X, MoonStar, GraduationCap, HeartPulse, User, FolderKanban } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface RoutineTask {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  notes: string;
}

type EntryCategory = "faith" | "learning" | "health" | "personal" | "projects";

interface TimelineEntry {
  minutes: number;
  label: string;
  sub?: string;
  category: EntryCategory;
}

const ENTRY_META: Record<EntryCategory, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  faith: { label: "Faith", Icon: MoonStar },
  learning: { label: "Learning", Icon: GraduationCap },
  health: { label: "Health", Icon: HeartPulse },
  personal: { label: "Personal", Icon: User },
  projects: { label: "Projects", Icon: FolderKanban },
};

const suggestedSchedule: Array<[string, string, EntryCategory]> = [
  ["05:00", "Wake Up", "personal"],
  ["05:35", "Quran Reading", "faith"],
  ["06:15", "Walking / Home Workout", "health"],
  ["07:30", "Breakfast", "health"],
  ["08:00", "Deep Work 1 · Learning focus", "learning"],
  ["09:15", "Deep Work 2 · Coding practice", "learning"],
  ["11:00", "Project Block · Build & ship", "projects"],
  ["12:45", "Lunch", "health"],
  ["14:30", "Deep Work 3 · Study rotation", "learning"],
  ["16:45", "Light block · Git & docs", "projects"],
  ["19:00", "Bestie Time (~2h)", "personal"],
  ["21:00", "Sleep", "personal"],
];

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formattedToHM(formatted: string): string | null {
  const m = formatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function minutesToLabel(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wakeTime, setWakeTime] = useState("");
  const [notes, setNotes] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [nowMin, setNowMin] = useState<number | null>(null);
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [sleepTime, setSleepTime] = useState("21:00");

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/routine").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([settingsData, routineData]) => {
      if (routineData) {
        setTasks((routineData.tasks || []).map((t: RoutineTask) => ({ ...t, id: String(t.id) })));
        if (routineData.routine?.wakeTime) setWakeTime(routineData.routine.wakeTime);
        if (routineData.routine?.notes) setNotes(routineData.routine.notes);
      }
      if (settingsData?.settings) {
        setTimezone(settingsData.settings.timezone || "Asia/Karachi");
        setSleepTime(settingsData.settings.sleepTime || "21:00");
        if (!wakeTime && settingsData.settings.wakeTime) setWakeTime(settingsData.settings.wakeTime);
      }
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prayer times from the shared calculation service (user settings driven).
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/prayers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.prayers) return;
        const map: Record<string, string> = {};
        for (const p of d.prayers) map[p.name] = p.formatted;
        setPrayerTimes(map);
      })
      .catch(() => {});
  }, []);

  // Current minute-of-day in the USER'S timezone (not the device's).
  useEffect(() => {
    const update = () => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
      setNowMin(hmToMinutes(parts));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [timezone]);

  const timeline: TimelineEntry[] = useMemo(() => {
    const entries: TimelineEntry[] = [];
    const push = (hm: string, label: string, sub?: string, category: EntryCategory = "personal") =>
      entries.push({ minutes: hmToMinutes(hm), label, sub, category });

    const wake = wakeTime || "05:00";
    push(wake, "Wake Up", undefined, "personal");

    for (const name of PRAYER_ORDER) {
      const hm = prayerTimes[name] ? formattedToHM(prayerTimes[name]) : null;
      if (hm) push(hm, name, "Prayer", "faith");
    }

    const fajrHm = prayerTimes.Fajr ? formattedToHM(prayerTimes.Fajr) : null;
    if (fajrHm) push(addMinutes(fajrHm, 25), "Quran Reading", "30 min", "faith");

    const maghribHm = prayerTimes.Maghrib ? formattedToHM(prayerTimes.Maghrib) : null;
    if (maghribHm) push(addMinutes(maghribHm, 20), "Darood-e-Pak", "after Maghrib", "faith");

    for (const [hm, label, category] of suggestedSchedule) {
      if (label === "Wake Up" || label === "Sleep") continue;
      push(hm, label, undefined, category);
    }

    if (sleepTime) push(sleepTime, "Sleep", undefined, "personal");
    const reviewAt = addMinutes(sleepTime || "21:00", -15);
    push(reviewAt, "Daily Review", "2–3 minutes", "personal");

    entries.sort((a, b) => a.minutes - b.minutes);
    // de-dup same-minute entries keeping order stable
    return entries.filter((e, i) => i === 0 || e.minutes !== entries[i - 1].minutes || e.label !== entries[i - 1].label);
  }, [wakeTime, sleepTime, prayerTimes]);

  const activeIndex =
    nowMin === null ? -1 : timeline.reduce((acc, e, i) => (e.minutes <= nowMin ? i : acc), -1);

  const postUpdate = async (
    updates: Array<{ id: string; completed: boolean; notes?: string }>,
    alsoRoutine?: boolean
  ) => {
    const res = await fetch("/api/routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: updates, ...(alsoRoutine ? { wakeTime, notes } : {}) }),
    });
    if (!res.ok) throw new Error();
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || savingId) return;
    const nextCompleted = !task.completed;
    setSavingId(id);
    setError(null);
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));
    try {
      await postUpdate([{ id, completed: nextCompleted }]);
    } catch {
      setTasks(prev);
      setError("Couldn't save that. Try again.");
    } finally {
      setSavingId(null);
    }
  };

  const updateNotesLocal = (id: string, value: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, notes: value } : t)));

  const closeNote = (id: string) =>
    setExpandedNotes((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });

  const commitNote = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      await postUpdate([{ id, completed: task.completed, notes: task.notes }]);
    } catch {
      setError("Couldn't save the note. Try again.");
    }
  };

  const resetDay = async () => {
    if (resetting) return;
    setResetting(true);
    setError(null);
    const prev = tasks;
    try {
      setTasks((ts) => ts.map((t) => ({ ...t, completed: false })));
      await postUpdate(tasks.map((t) => ({ id: t.id, completed: false })));
    } catch {
      setTasks(prev);
      setError("Couldn't reset the day. Try again.");
    } finally {
      setResetting(false);
    }
  };

  const saveMeta = async () => {
    setError(null);
    try {
      await fetch("/api/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wakeTime, notes }),
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch {
      setError("Couldn't save. Try again.");
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const categories = Array.from(new Set(tasks.map((t) => t.category)));
  const sectionIcons = [Clock, MoonStar, StickyNote, RefreshCw];

  const renderSection = (title: string, icon: React.ReactNode, items: RoutineTask[]) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          <Badge variant={items.length > 0 && items.every((t) => t.completed) ? "success" : "secondary"}>
            {items.filter((t) => t.completed).length}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-faint">No habits in this group.</p>
        ) : (
          items.map((task) => {
            const noteOpen = expandedNotes.has(task.id);
            return (
              <div
                key={task.id}
                className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface2"
              >
                <div className="pt-0.5">
                  <Checkbox
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    disabled={savingId === task.id}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${task.completed ? "text-faint line-through" : "text-ink"}`}>
                      {task.label}
                    </span>
                    <Badge variant="secondary">{task.category}</Badge>
                  </div>
                  {noteOpen ? (
                    <div className="mt-1 flex items-center gap-1">
                      <Input
                        autoFocus
                        value={task.notes}
                        onChange={(e) => updateNotesLocal(task.id, e.target.value)}
                        onBlur={() => {
                          commitNote(task.id);
                          closeNote(task.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") closeNote(task.id);
                        }}
                        placeholder="Add a note…"
                        className="h-7 text-xs"
                        aria-label={`Note for ${task.label}`}
                      />
                      <button
                        type="button"
                        aria-label={`Close note editor for ${task.label}`}
                        onClick={() => closeNote(task.id)}
                        className="rounded p-1 text-muted hover:bg-surface2 hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : task.notes ? (
                    <button
                      type="button"
                      onClick={() => setExpandedNotes((s) => new Set(s).add(task.id))}
                      className="mt-0.5 flex max-w-full items-center gap-1 truncate text-left text-xs text-muted hover:text-accent"
                    >
                      <StickyNote className="h-3 w-3 shrink-0" />
                      <span className="truncate">{task.notes}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedNotes((s) => new Set(s).add(task.id))}
                      className="mt-0.5 text-xs text-faint hover:text-accent"
                    >
                      + note
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Today</h1>
            <p className="mt-1 text-sm text-muted">
              {loading
                ? "Loading your day…"
                : tasks.length > 0
                ? `${completedCount} of ${tasks.length} habits complete (${progress}%)`
                : "Your daily plan and habits"}
            </p>
          </div>
          {!loading && tasks.length > 0 && (
            <Button variant="outline" size="sm" onClick={resetDay} disabled={resetting}>
              <RefreshCw className={`mr-2 h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
              Reset Day
            </Button>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* ── Full-day timeline ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-accent" />
                Timeline
              </CardTitle>
              <span className="text-xs text-faint">Prayer times are calculated for your location</span>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-0.5 border-l border-line pl-0">
              {timeline.map((entry, i) => {
                const isPast = nowMin !== null && entry.minutes < nowMin && i !== activeIndex;
                const isActive = i === activeIndex;
                const meta = ENTRY_META[entry.category];
                const Icon = meta.Icon;
                return (
                  <li
                    key={`${entry.minutes}-${entry.label}`}
                    aria-current={isActive ? "step" : undefined}
                    className={`-ml-px flex min-h-[34px] items-center gap-3 border-l-2 py-1 pl-4 ${
                      isActive ? "border-accent bg-accent-tint/60" : "border-transparent"
                    } ${isPast ? "opacity-45" : ""}`}
                  >
                    <span className="w-[70px] shrink-0 font-mono text-xs tabular-nums text-faint">
                      {minutesToLabel(entry.minutes)}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-accent" : "bg-line"}`}
                    />
                    <Icon className="h-3.5 w-3.5 shrink-0 text-faint" />
                    <span className={`truncate text-sm ${isActive ? "font-medium text-accent-strong" : "text-ink"}`}>
                      {entry.label}
                    </span>
                    {entry.sub && <span className="hidden text-xs text-faint sm:inline">· {entry.sub}</span>}
                    <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint sm:inline">
                      {meta.label}
                    </span>
                    {isActive && (
                      <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                        NOW
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* ── Habit checklist ── */}
        {!loading && tasks.length === 0 && !error && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted">
              No active disciplines configured yet. Add habits in Settings to build your daily routine.
            </CardContent>
          </Card>
        )}

        {!loading && tasks.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {categories.map((cat, i) => {
              const Icon = sectionIcons[i % sectionIcons.length];
              const items = tasks.filter((t) => t.category === cat);
              return renderSection(
                cat.charAt(0).toUpperCase() + cat.slice(1),
                <Icon className="h-4 w-4 text-faint" />,
                items
              );
            })}
          </div>
        )}

        {/* ── Wake & reflection ── */}
        {!loading && tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Wake Time &amp; Reflection</CardTitle>
                <Button variant="outline" size="sm" onClick={saveMeta}>
                  {savedMsg ? "Saved ✓" : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <label htmlFor="wake-input" className="whitespace-nowrap text-xs uppercase tracking-wider text-muted">
                  Actual wake time
                </label>
                <Input
                  id="wake-input"
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-36"
                />
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did today go? Any obstacles?"
                rows={3}
                aria-label="Reflection notes"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function addMinutes(hm: string, delta: number): string {
  const total = ((hmToMinutes(hm) + delta) % 1440 + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
