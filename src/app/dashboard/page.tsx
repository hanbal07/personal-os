"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  Dumbbell,
  Footprints,
  Utensils,
  Droplets,
  BedDouble,
  Target,
  FolderKanban,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Feather,
  BellRing,
} from "lucide-react";

interface DashboardData {
  date: string;
  greeting: string;
  summary: { tasksCompleted: number; tasksTotal: number; disciplineScore: number; streak: number };
  prayers: { times: Array<{ name: string; time: string; formatted: string }>; nextPrayer: { name: string; time: string; remaining: string } | null; completed: number; total: number };
  quran: { completed: boolean; pagesRead: number };
  darood: { count: number; target: number };
  meals: { count: number; target: number; records: Array<{ mealType: string; content: string }> };
  health: { walking: { completed: boolean; targetMins: number }; exercise: { completed: number; total: number; targetMins: number }; water: number };
  learning: { hours: number; targetHours: number; sessions: number };
  projects: { active: number; records: Array<{ title: string; phase: string; completion: number }> };
  habits: { completed: number; total: number };
  sleep: { hours: number; target: number; bedTime: string; wakeTime: string };
}

interface RoutineTask {
  id: string;
  label: string;
  category: string;
  completed: boolean;
}

interface SkillFocus {
  skill: string;
  topic: string;
}

function useLocalClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
      {children}
    </h2>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [focus, setFocus] = useState<SkillFocus | null>(null);

  const now = useLocalClock();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Couldn't load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Supporting reads for personalization + inline task completion.
    fetch("/api/routine")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.tasks && setTasks(d.tasks))
      .catch(() => {});
    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const skills = d?.skills || [];
        for (const s of skills) {
          const inProgress = (s.topics || []).find((t: { status: string }) => t.status === "IN_PROGRESS");
          if (inProgress) {
            setFocus({ skill: s.name, topic: inProgress.title });
            return;
          }
        }
        const studied = [...skills].sort((a, b) => (b.practiceHours || 0) - (a.practiceHours || 0))[0];
        if (studied?.currentTopic && studied.currentTopic !== "-") {
          setFocus({ skill: studied.name, topic: studied.currentTopic });
        }
      })
      .catch(() => {});
  }, [load]);

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || savingTaskId) return;
    const nextCompleted = !task.completed;

    setSavingTaskId(id);
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)));

    try {
      const res = await fetch("/api/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: [{ id, completed: nextCompleted }] }),
      });
      if (!res.ok) throw new Error();
      if (data) {
        setData({
          ...data,
          summary: {
            ...data.summary,
            tasksCompleted: data.summary.tasksCompleted + (nextCompleted ? 1 : -1),
          },
          habits: {
            ...data.habits,
            completed: data.habits.completed + (nextCompleted ? 1 : -1),
          },
        });
      }
    } catch {
      setTasks(prev);
    } finally {
      setSavingTaskId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-800" />
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-800/70" />
          </div>
          <div className="h-36 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-40" />
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <Card className="border-red-900/50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h3 className="mb-2 text-lg font-medium text-white">Couldn&apos;t load your dashboard</h3>
            <p className="mb-4 text-sm text-zinc-500">{error || "No data available."}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const timeLine = now
    ? now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) +
      " · " +
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "\u00A0";

  const { prayers, summary, learning } = data;
  const nextPrayer = prayers.nextPrayer;
  const taskProgress =
    summary.tasksTotal > 0 ? Math.round((summary.tasksCompleted / summary.tasksTotal) * 100) : 0;
  const incompleteTasks = tasks.filter((t) => !t.completed).slice(0, 4);
  const isNewUser =
    summary.streak === 0 && summary.tasksCompleted === 0 && learning.hours === 0 && prayers.completed === 0;

  // Honest, data-driven "what next" actions.
  const ctas: Array<{ href: string; label: string }> = [];
  if (nextPrayer) {
    ctas.push({ href: "/namaz", label: `Mark ${nextPrayer.name}` });
  }
  if (!data.quran.completed) {
    ctas.push({ href: "/quran", label: "Log Quran" });
  }
  if (learning.hours < learning.targetHours) {
    ctas.push({ href: "/learning", label: "Log study session" });
  }
  if (ctas.length === 0) {
    ctas.push({ href: "/review", label: "Do the daily review" });
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Greeting + live context */}
        <div>
          <h1 className="text-2xl font-bold text-white">{data.greeting}</h1>
          <p className="mt-0.5 text-sm capitalize text-zinc-500">{timeLine}</p>
        </div>

        {isNewUser && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex items-start gap-3 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-white">Welcome! Your journey starts today.</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Open <Link href="/routine" className="text-blue-400 hover:underline">Today</Link> and check off your
                  first task. Scores and streaks appear as you track real activity.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HERO — Next action + today's progress */}
        <section aria-label="Next up and today's progress">
          <Card className="border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950">
            <CardContent className="grid grid-cols-1 gap-6 p-5 md:grid-cols-[1.2fr_1fr] md:p-6">
              <div>
                <SectionLabel>Next up</SectionLabel>
                {nextPrayer ? (
                  <>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-3xl font-bold tracking-tight text-white">{nextPrayer.name}</span>
                      <span className="text-sm text-zinc-400">{nextPrayer.remaining} from now</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ctas.map((c) => (
                        <Link
                          key={c.href + c.label}
                          href={c.href}
                          className={cn(buttonVariants({ size: "sm" }), "flex items-center gap-1.5")}
                        >
                          <BellRing className="h-3.5 w-3.5" />
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-3xl font-bold tracking-tight text-white">
                        All {prayers.total} prayers done
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ctas.map((c) => (
                        <Link
                          key={c.href + c.label}
                          href={c.href}
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col justify-center space-y-3 border-t pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Today&apos;s progress</span>
                  <span className="font-medium text-white">
                    {summary.tasksCompleted}/{summary.tasksTotal}
                  </span>
                </div>
                <Progress value={taskProgress} variant={taskProgress >= 80 ? "success" : "default"} />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary">Streak {summary.streak}d</Badge>
                  <Badge variant={taskProgress >= 80 ? "success" : "secondary"}>{taskProgress}% of tasks</Badge>
                  {focus && (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                      Focus: {focus.skill}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* TODAY */}
        <section aria-label="Today's tasks" className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Today</SectionLabel>
            <Link href="/routine" className="text-xs text-zinc-500 hover:text-zinc-300">
              Full routine →
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              {tasks.length === 0 ? (
                <p className="py-2 text-center text-sm text-zinc-500">
                  No routine configured yet.{" "}
                  <Link href="/routine" className="text-blue-400 hover:underline">
                    Open Today
                  </Link>{" "}
                  to see your daily plan.
                </p>
              ) : incompleteTasks.length === 0 ? (
                <p className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> All tasks complete. Well earned.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-800/60">
                  {incompleteTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 py-2.5">
                      <Checkbox
                        checked={false}
                        onChange={() => toggleTask(task.id)}
                        disabled={savingTaskId === task.id}
                        aria-label={`Complete ${task.label}`}
                      />
                      <span className="text-sm text-zinc-200">{task.label}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-zinc-600">
                        {task.category}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* FAITH */}
        <section aria-label="Faith" className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Faith</SectionLabel>
            <div className="gap-4 text-xs text-zinc-500">
              <Link href="/namaz" className="hover:text-zinc-300">Namaz</Link>
              <Link href="/quran" className="ml-4 hover:text-zinc-300">Quran &amp; Darood</Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <PrayerTimesWidget prayers={prayers} />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quran &amp; Darood</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-400">
                    <BookOpen className="h-3.5 w-3.5" /> Quran
                  </span>
                  <Badge variant={data.quran.completed ? "success" : "secondary"}>
                    {data.quran.completed ? "Done" : `${data.quran.pagesRead} pages`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-400">
                    <Feather className="h-3.5 w-3.5" /> Darood
                  </span>
                  <Badge variant={data.darood.count >= data.darood.target ? "success" : "warning"}>
                    {data.darood.count} / {data.darood.target}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Prayers</span>
                  <Badge variant={prayers.completed >= prayers.total ? "success" : "secondary"}>
                    {prayers.completed} / {prayers.total}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* LEARNING + HEALTH row */}
        <section aria-label="Learning and health" className="space-y-3">
          <SectionLabel>Learning &amp; Health</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <LearningWidget learning={learning} focus={focus} />
            <HealthWidget health={data.health} meals={data.meals.count} mealsTarget={data.meals.target} />
            <SleepWidget sleep={data.sleep} />
          </div>
        </section>

        {/* PROJECTS */}
        {data.projects.active > 0 && (
          <section aria-label="Projects" className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Projects</SectionLabel>
              <Link href="/projects" className="text-xs text-zinc-500 hover:text-zinc-300">
                Manage →
              </Link>
            </div>
            <Card>
              <CardContent className="space-y-3 p-4">
                {data.projects.records.slice(0, 3).map((project) => (
                  <div key={project.title} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm text-zinc-300">{project.title}</span>
                      <span className="ml-3 shrink-0 text-xs text-zinc-500">
                        {project.phase.toLowerCase()} · {project.completion}%
                      </span>
                    </div>
                    <Progress
                      value={project.completion}
                      variant={project.phase === "COMPLETED" ? "success" : "default"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function PrayerTimesWidget({ prayers }: { prayers: DashboardData["prayers"] }) {
  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (status === "in-progress") return <Clock className="h-4 w-4 text-yellow-400" />;
    return <Circle className="h-4 w-4 text-zinc-600" />;
  };

  const getPrayerStatus = (name: string) => {
    if (!prayers.nextPrayer) return "pending";
    if (name === prayers.nextPrayer.name) return "in-progress";
    const order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    return order.indexOf(name) < order.indexOf(prayers.nextPrayer.name) ? "completed" : "pending";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Prayer Times</CardTitle>
          <Moon className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prayers.times.map((prayer) => (
            <div key={prayer.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon(getPrayerStatus(prayer.name))}
                <span className="text-sm text-zinc-300">{prayer.name}</span>
              </div>
              <span className="text-sm text-zinc-500">{prayer.formatted}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LearningWidget({
  learning,
  focus,
}: {
  learning: DashboardData["learning"];
  focus: SkillFocus | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Deep Work</CardTitle>
          <Target className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Today</span>
            <span className="text-white">
              {learning.hours}h / {learning.targetHours}h
            </span>
          </div>
          <Progress
            value={Math.min(100, Math.round((learning.hours / Math.max(1, learning.targetHours)) * 100))}
            variant={learning.hours >= learning.targetHours ? "success" : "default"}
          />
        </div>
        {focus ? (
          <div className="border-t border-zinc-800 pt-3">
            <p className="text-xs text-zinc-500">Current focus</p>
            <p className="mt-0.5 truncate text-sm text-zinc-200">
              {focus.skill} · {focus.topic}
            </p>
          </div>
        ) : (
          <p className="border-t border-zinc-800 pt-3 text-xs text-zinc-500">
            Start a session on the Learn page to build your focus history.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HealthWidget({
  health,
  meals,
  mealsTarget,
}: {
  health: DashboardData["health"];
  meals: number;
  mealsTarget: number;
}) {
  const walkingTarget = health.walking.targetMins ?? 30;
  const workoutTarget = health.exercise.targetMins ?? 45;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Health</CardTitle>
          <Dumbbell className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <Footprints className="h-3.5 w-3.5" /> Walking
            </span>
            <span className="text-white">
              {health.walking.completed ? walkingTarget : 0}/{walkingTarget} min
            </span>
          </div>
          <Progress value={health.walking.completed ? 100 : 0} variant={health.walking.completed ? "success" : "warning"} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <Droplets className="h-3.5 w-3.5" /> Water
            </span>
            <span className="text-white">{health.water}/8 glasses</span>
          </div>
          <Progress value={Math.min(100, Math.round((health.water / 8) * 100))} />
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5 text-sm">
          <span className="flex items-center gap-2 text-zinc-400">
            <Utensils className="h-3.5 w-3.5" /> Meals
          </span>
          <span className="text-white">
            {meals}/{mealsTarget} logged
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SleepWidget({ sleep }: { sleep: DashboardData["sleep"] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sleep</CardTitle>
          <BedDouble className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{sleep.hours > 0 ? sleep.hours + "h" : "—"}</p>
            <p className="text-xs text-zinc-500">Target: {sleep.target}h</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs text-zinc-400">
              Bed: <span className="text-white">{sleep.bedTime || "Not set"}</span>
            </p>
            <p className="text-xs text-zinc-400">
              Wake: <span className="text-white">{sleep.wakeTime || "Not set"}</span>
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Progress
            value={sleep.hours > 0 ? Math.min(100, Math.round((sleep.hours / sleep.target) * 100)) : 0}
            variant={sleep.hours >= sleep.target ? "success" : "warning"}
          />
        </div>
        {!sleep.hours && (
          <p className="mt-2 text-xs text-zinc-600">
            Log last night&apos;s sleep on the Health page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}