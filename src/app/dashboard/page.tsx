"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { useEffect, useState } from "react";
import {
  Clock,
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
  Zap,
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
  settings?: { walkingTargetMins?: number; workoutTargetMins?: number };
}

function PrayerTimesWidget({ prayers, nextPrayer }: { prayers: DashboardData["prayers"]; nextPrayer: DashboardData["prayers"]["nextPrayer"] }) {
  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (status === "in-progress") return <Clock className="h-4 w-4 text-yellow-400" />;
    return <Circle className="h-4 w-4 text-zinc-600" />;
  };

  const getPrayerStatus = (name: string) => {
    if (!nextPrayer) return "pending";
    if (name === nextPrayer.name) return "in-progress";
    const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const nextIndex = prayerOrder.indexOf(nextPrayer.name);
    const currentIndex = prayerOrder.indexOf(name);
    return currentIndex < nextIndex ? "completed" : "pending";
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
        <div className="mt-4 pt-3 border-t border-zinc-800">
          {nextPrayer ? (
            <p className="text-xs text-zinc-500">Next: {nextPrayer.name} in {nextPrayer.remaining}</p>
          ) : (
            <p className="text-xs text-zinc-500">All prayers completed for today</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthWidget({ health, settings }: { health: DashboardData["health"]; settings: DashboardData["settings"] | null }) {
  const walkingTarget = settings?.walkingTargetMins ?? 30;
  const workoutTarget = settings?.workoutTargetMins ?? 45;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Health & Fitness</CardTitle>
          <Dumbbell className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <Footprints className="h-3.5 w-3.5" /> Walking
            </span>
            <span className="text-white">{health.walking.completed ? walkingTarget : 0} / {walkingTarget} min</span>
          </div>
          <Progress value={health.walking.completed ? 100 : 0} variant={health.walking.completed ? "success" : "warning"} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <Dumbbell className="h-3.5 w-3.5" /> Workout
            </span>
            <span className="text-white">{health.exercise.completed} / {workoutTarget} min</span>
          </div>
          <Progress value={health.exercise.total > 0 ? Math.min(100, Math.round((health.exercise.completed / Math.max(1, health.exercise.total)) * 100)) : 0} variant={health.exercise.completed > 0 ? "success" : "warning"} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5" /> Water
            </span>
            <span className="text-white">{health.water} / 8 glasses</span>
          </div>
          <Progress value={Math.min(100, Math.round((health.water / 8) * 100))} />
        </div>
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-zinc-400 flex items-center gap-2">
            <Utensils className="h-3.5 w-3.5" /> Meals
          </span>
          <span className="text-white">Coming soon</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LearningWidget({ learning }: { learning: DashboardData["learning"] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Learning Progress</CardTitle>
          <Target className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Deep Work</span>
              <span className="text-white">{learning.hours}h / {learning.targetHours}h</span>
            </div>
            <Progress value={Math.min(100, Math.round((learning.hours / Math.max(1, learning.targetHours)) * 100))} variant={learning.hours >= learning.targetHours ? "success" : "default"} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Sessions</span>
              <span className="text-white">{learning.sessions}</span>
            </div>
            <Progress value={Math.min(100, learning.sessions * 25)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DailyTasksWidget({ summary, habits }: { summary: DashboardData["summary"]; habits: DashboardData["habits"] }) {
  if (habits.total === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 text-center py-4">
            No habits set up yet. <a href="/settings" className="text-blue-400 hover:underline">Configure habits</a> to track daily tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
          <Badge variant="secondary">{summary.tasksCompleted}/{summary.tasksTotal}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-500 text-center py-4">
          View the <a href="/routine" className="text-blue-400 hover:underline">Daily Routine</a> page to see and complete your tasks.
        </p>
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
            <p className="text-2xl font-bold text-white">{sleep.hours > 0 ? sleep.hours + "h" : "Not tracked"}</p>
            <p className="text-xs text-zinc-500">Target: {sleep.target}h</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-zinc-400">Bed: <span className="text-white">{sleep.bedTime || "Not set"}</span></p>
            <p className="text-xs text-zinc-400">Wake: <span className="text-white">{sleep.wakeTime || "Not set"}</span></p>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={sleep.hours > 0 ? Math.min(100, Math.round((sleep.hours / sleep.target) * 100)) : 0} variant={sleep.hours >= sleep.target ? "success" : "warning"} />
        </div>
      </CardContent>
    </Card>
  );
}

function DisciplineWidget({ summary, streak }: { summary: DashboardData["summary"]; streak: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Discipline Score</CardTitle>
          <Zap className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ScoreGauge score={summary.disciplineScore} size="md" />
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Current Streak</span>
              <span className="text-white font-medium">{streak} days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Tasks</span>
              <span className="text-white font-medium">{summary.tasksCompleted}/{summary.tasksTotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Discipline</span>
              <span className="text-white font-medium">{summary.disciplineScore}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IslamicWidget({ quran, darood, prayers }: { quran: DashboardData["quran"]; darood: DashboardData["darood"]; prayers: DashboardData["prayers"] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Islamic Routine</CardTitle>
          <BookOpen className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Quran</span>
          <Badge variant={quran.completed ? "success" : "secondary"}>
            {quran.completed ? "Completed" : "Not started"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Darood-e-Pak</span>
          <Badge variant={darood.count >= darood.target ? "success" : "warning"}>
            {darood.count} / {darood.target}
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
  );
}

function ProjectsWidget({ projects }: { projects: DashboardData["projects"] }) {
  if (projects.active === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-zinc-500" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 text-center py-4">
            No active projects. <a href="/projects" className="text-blue-400 hover:underline">Create your first project</a>.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Projects</CardTitle>
          <FolderKanban className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.records.map((project) => (
          <div key={project.title} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">{project.title}</span>
              <Badge variant={project.phase === "COMPLETED" ? "success" : "secondary"}>
                {project.phase}
              </Badge>
            </div>
            <Progress value={project.completion} variant={project.phase === "COMPLETED" ? "success" : "default"} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AlertsWidget() {
  return (
    <Card className="border-yellow-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            Insights
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-500">
          Complete your first week to unlock personalized insights.
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Sun className="h-6 w-6 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Good Morning</h1>
              <p className="text-sm text-zinc-500">Loading your dashboard...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Sun className="h-6 w-6 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Good Morning</h1>
            </div>
          </div>
          <Card className="border-red-900/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Failed to load dashboard</h3>
              <p className="text-sm text-zinc-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return <AppShell><div className="text-center py-12">No data available</div></AppShell>;
  }

  const settings = data.settings;
  const isNewUser =
    data.summary.streak === 0 &&
    data.summary.tasksCompleted === 0 &&
    data.learning.hours === 0 &&
    data.prayers.completed === 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sun className="h-6 w-6 text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">{data.greeting}</h1>
            <p className="text-sm text-zinc-500">
              Today&apos;s mission: Stay disciplined. Build skills. Trust the process.
            </p>
          </div>
        </div>

        {isNewUser && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex items-start gap-3 p-4">
              <Sparkles className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Welcome! Your journey starts today.</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Start your first day to build your progress history. Scores and streaks will appear here as you track real activity — they stay empty until then, so nothing is misleading.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DisciplineWidget summary={data.summary} streak={data.summary.streak} />
          <PrayerTimesWidget prayers={data.prayers} nextPrayer={data.prayers.nextPrayer} />
          <IslamicWidget quran={data.quran} darood={data.darood} prayers={data.prayers} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DailyTasksWidget summary={data.summary} habits={data.habits} />
          <HealthWidget health={data.health} settings={settings} />
          <LearningWidget learning={data.learning} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SleepWidget sleep={data.sleep} />
          <ProjectsWidget projects={data.projects} />
          <AlertsWidget />
        </div>
      </div>
    </AppShell>
  );
}