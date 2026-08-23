"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreGauge } from "@/components/ui/score-gauge";
import {
  Clock,
  Sun,
  Moon,
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
  Star,
  Zap,
} from "lucide-react";

function PrayerTimesWidget() {
  const prayers = [
    { name: "Fajr", time: "4:45 AM", status: "completed" as const },
    { name: "Dhuhr", time: "12:15 PM", status: "completed" as const },
    { name: "Asr", time: "3:45 PM", status: "in-progress" as const },
    { name: "Maghrib", time: "6:30 PM", status: "pending" as const },
    { name: "Isha", time: "8:00 PM", status: "pending" as const },
  ];

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (status === "in-progress") return <Clock className="h-4 w-4 text-yellow-400" />;
    return <Circle className="h-4 w-4 text-zinc-600" />;
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
          {prayers.map((prayer) => (
            <div
              key={prayer.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {statusIcon(prayer.status)}
                <span className="text-sm text-zinc-300">{prayer.name}</span>
              </div>
              <span className="text-sm text-zinc-500">{prayer.time}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            Next: Asr in 2h 15m
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthWidget() {
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
            <span className="text-white">25 / 30 min</span>
          </div>
          <Progress value={83} variant="success" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <Dumbbell className="h-3.5 w-3.5" /> Workout
            </span>
            <span className="text-white">0 / 45 min</span>
          </div>
          <Progress value={0} variant="warning" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400 flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5" /> Water
            </span>
            <span className="text-white">4 / 8 glasses</span>
          </div>
          <Progress value={50} />
        </div>
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-zinc-400 flex items-center gap-2">
            <Utensils className="h-3.5 w-3.5" /> Meals
          </span>
          <span className="text-white">2 / 4</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LearningWidget() {
  const skills = [
    { name: "Python", progress: 35, status: "in-progress" },
    { name: "Git/GitHub", progress: 20, status: "in-progress" },
    { name: "Data Science", progress: 0, status: "not-started" },
    { name: "Web Dev", progress: 0, status: "not-started" },
    { name: "ML/AI", progress: 0, status: "not-started" },
    { name: "Deep Learning", progress: 0, status: "not-started" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Learning Progress</CardTitle>
          <Target className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{skill.name}</span>
              <span className="text-zinc-500">{skill.progress}%</span>
            </div>
            <Progress
              value={skill.progress}
              variant={
                skill.progress >= 75
                  ? "success"
                  : skill.progress > 0
                  ? "default"
                  : "default"
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DailyTasksWidget() {
  const tasks = [
    { name: "Wake up at 5:00 AM", completed: true, category: "routine" },
    { name: "Fajr prayer", completed: true, category: "islamic" },
    { name: "Quran reading", completed: true, category: "islamic" },
    { name: "Morning walk", completed: true, category: "health" },
    { name: "Python - Functions", completed: false, category: "learning" },
    { name: "Deep work: 2 hours", completed: false, category: "productivity" },
    { name: "Project work", completed: false, category: "projects" },
    { name: "Evening Darood", completed: false, category: "islamic" },
  ];

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
          <Badge variant="secondary">
            {completed}/{total}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-3 group cursor-pointer">
            {task.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                task.completed
                  ? "text-zinc-500 line-through"
                  : "text-zinc-300"
              }`}
            >
              {task.name}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SleepWidget() {
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
            <p className="text-2xl font-bold text-white">7.5h</p>
            <p className="text-xs text-zinc-500">Target: 8h</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-zinc-400">
              Bed: <span className="text-white">9:15 PM</span>
            </p>
            <p className="text-xs text-zinc-400">
              Wake: <span className="text-white">4:45 AM</span>
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={94} variant="success" />
        </div>
      </CardContent>
    </Card>
  );
}

function DisciplineWidget() {
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
          <ScoreGauge score={78} size="md" />
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Current Streak</span>
              <span className="text-white font-medium">5 days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Best Streak</span>
              <span className="text-white font-medium">12 days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Weekly Avg</span>
              <span className="text-white font-medium">72%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Consistency</span>
              <span className="text-white font-medium">85%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IslamicWidget() {
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
          <Badge variant="success">Completed</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Darood-e-Pak</span>
          <Badge variant="warning">11 / 33</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Prayers</span>
          <Badge variant="success">3 / 5</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectsWidget() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Projects</CardTitle>
          <FolderKanban className="h-4 w-4 text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Python Calculator</span>
            <Badge variant="success">Completed</Badge>
          </div>
          <Progress value={100} variant="success" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Todo CLI App</span>
            <Badge>In Progress</Badge>
          </div>
          <Progress value={40} />
        </div>
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
            Alerts
          </CardTitle>
          <Badge variant="warning">2</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-yellow-400/80">
          You missed evening learning 3 times this week. Consider moving study
          sessions to morning.
        </p>
        <p className="text-sm text-zinc-400">
          Workout has been skipped for 2 consecutive days.
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sun className="h-6 w-6 text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Good Morning</h1>
            <p className="text-sm text-zinc-500">
              Today&apos;s mission: Stay disciplined. Build skills. Trust the
              process.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DisciplineWidget />
          <PrayerTimesWidget />
          <IslamicWidget />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DailyTasksWidget />
          <HealthWidget />
          <LearningWidget />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SleepWidget />
          <ProjectsWidget />
          <AlertsWidget />
        </div>
      </div>
    </AppShell>
  );
}
