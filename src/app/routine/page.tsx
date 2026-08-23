"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clock, Sun, Moon, CheckCircle2, RefreshCw, StickyNote, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface RoutineTask {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  notes: string;
}

const suggestedSchedule = [
  ["05:00", "Wake Up"],
  ["05:10", "Fajr Prayer"],
  ["05:30", "Quran Reading"],
  ["06:00", "Walking / Home Exercise"],
  ["07:00", "Breakfast"],
  ["07:30", "Deep Work Block 1 - Concept Learning"],
  ["09:15", "Deep Work Block 2 - Coding Practice"],
  ["12:45", "Lunch"],
  ["13:30", "Asr Prayer"],
  ["13:45", "Deep Work Block 3 - Project Development"],
  ["17:00", "Maghrib Prayer"],
  ["17:15", "Darood-e-Pak"],
  ["19:45", "Dinner"],
  ["20:00", "Isha Prayer"],
  ["20:15", "Daily Review + Reflection"],
  ["21:00", "Sleep"],
] as const;

export default function RoutinePage() {
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

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  const scheduleMinutes = suggestedSchedule.map(([time]) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  });
  const activeSlotIndex =
    nowMin === null
      ? -1
      : suggestedSchedule.reduce(
          (acc, _, i) => (scheduleMinutes[i] <= nowMin ? i : acc),
          -1
        );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/routine");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(
        (data.tasks || []).map((t: RoutineTask) => ({
          ...t,
          id: String(t.id),
        }))
      );
      if (data.routine) {
        setWakeTime(data.routine.wakeTime || "");
        setNotes(data.routine.notes || "");
      }
    } catch {
      setError("Failed to load your routine. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const postUpdate = async (
    updates: Array<{ id: string; completed: boolean; notes?: string }>,
    alsoRoutine?: boolean
  ) => {
    const res = await fetch("/api/routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: updates,
        ...(alsoRoutine ? { wakeTime, notes } : {}),
      }),
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
      setError("Could not save. Try again.");
    } finally {
      setSavingId(null);
    }
  };

  const updateNotesLocal = (id: string, value: string) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, notes: value } : t)));
  };

  const commitNote = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      await postUpdate([{ id, completed: task.completed, notes: task.notes }]);
    } catch {
      setError("Could not save note. Try again.");
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
      setError("Could not reset day. Try again.");
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
      setError("Could not save. Try again.");
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const categories = Array.from(new Set(tasks.map((t) => t.category)));
  const sectionIcons = [Sun, Clock, Moon, CheckCircle2, RefreshCw];

  const renderSection = (title: string, icon: React.ReactNode, items: RoutineTask[]) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Badge variant="secondary">
            {items.filter((t) => t.completed).length}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-600 py-2">No tasks in this group.</p>
        ) : (
          items.map((task) => {
            const noteOpen = expandedNotes.has(task.id);
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 py-2.5 group rounded-lg hover:bg-zinc-800/30 px-2 -mx-2 transition-colors"
              >
                <div className="pt-0.5">
                  <Checkbox checked={task.completed} onChange={() => toggleTask(task.id)} disabled={savingId === task.id} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${task.completed ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                      {task.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{task.category}</span>
                  </div>
                  {noteOpen ? (
                    <div className="mt-1 flex items-center gap-1">
                      <Input
                        autoFocus
                        value={task.notes}
                        onChange={(e) => updateNotesLocal(task.id, e.target.value)}
                        onBlur={() => {
                          commitNote(task.id);
                          setExpandedNotes((s) => {
                            const next = new Set(s);
                            next.delete(task.id);
                            return next;
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") {
                            updateNotesLocal(task.id, task.notes);
                            setExpandedNotes((s) => {
                              const next = new Set(s);
                              next.delete(task.id);
                              return next;
                            });
                          }
                        }}
                        placeholder="Add a note…"
                        className="h-7 text-xs"
                        aria-label={`Note for ${task.label}`}
                      />
                      <button
                        type="button"
                        aria-label={`Close note editor for ${task.label}`}
                        onClick={() =>
                          setExpandedNotes((s) => {
                            const next = new Set(s);
                            next.delete(task.id);
                            return next;
                          })
                        }
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : task.notes ? (
                    <button
                      type="button"
                      onClick={() => setExpandedNotes((s) => new Set(s).add(task.id))}
                      className="mt-0.5 flex max-w-full items-center gap-1 truncate text-left text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      <StickyNote className="h-3 w-3 shrink-0" />
                      <span className="truncate">{task.notes}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedNotes((s) => new Set(s).add(task.id))}
                      className="mt-0.5 text-xs text-zinc-600 hover:text-zinc-400"
                    >
                      + note
                    </button>
                  )}
                </div>
                {task.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : null}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Routine</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {loading
                ? "Loading…"
                : `${completedCount} of ${tasks.length} tasks completed (${progress}%)`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={resetDay} disabled={resetting || tasks.length === 0}>
            <RefreshCw className={`h-4 w-4 mr-2 ${resetting ? "animate-spin" : ""}`} />
            Reset Day
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && tasks.length === 0 && !error && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              No active disciplines configured yet. Add habits in Settings to build your daily routine.
            </CardContent>
          </Card>
        )}

        {tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  Today&apos;s Timeline
                </CardTitle>
                <span className="text-xs text-zinc-600">Suggested plan</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {[
                  suggestedSchedule.slice(0, Math.ceil(suggestedSchedule.length / 2)),
                  suggestedSchedule.slice(Math.ceil(suggestedSchedule.length / 2)),
                ].map((half, halfIdx) => (
                  <ol key={halfIdx}>
                    {half.map(([time, label]) => {
                      const i = suggestedSchedule.findIndex((s) => s[0] === time);
                      const isPast = nowMin !== null && scheduleMinutes[i] < nowMin && i !== activeSlotIndex;
                      const isActive = i === activeSlotIndex;
                      return (
                        <li
                          key={`${time}-${label}`}
                          className={`flex min-h-[30px] items-center gap-3 rounded-md px-2 -mx-2 ${
                            isActive ? "bg-white/5" : ""
                          } ${isPast ? "opacity-45" : ""}`}
                        >
                          <span className="w-11 shrink-0 font-mono text-xs text-zinc-500">{time}</span>
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              isActive ? "bg-white ring-4 ring-white/15" : "bg-zinc-700"
                            }`}
                            aria-hidden="true"
                          />
                          <span className={`text-sm ${isActive ? "font-medium text-white" : "text-zinc-400"}`}>
                            {label}
                          </span>
                          {isActive && (
                            <span className="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-950">
                              NOW
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tasks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => {
              const Icon = sectionIcons[i % sectionIcons.length];
              const items = tasks.filter((t) => t.category === cat);
              return renderSection(
                cat.charAt(0).toUpperCase() + cat.slice(1),
                <Icon className="h-4 w-4 text-zinc-400" />,
                items
              );
            })}
          </div>
        )}

        {tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Wake Time & Reflection</CardTitle>
                <Button variant="outline" size="sm" onClick={saveMeta}>
                  {savedMsg ? "Saved ✓" : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                  Actual Wake Time
                </label>
                <Input
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
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}