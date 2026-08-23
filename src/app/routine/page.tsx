"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clock, Sun, Moon, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface RoutineTask {
  id: string;
  time: string;
  label: string;
  category: "routine" | "islamic" | "health" | "learning" | "personal" | "productivity";
  completed: boolean;
  notes: string;
}

const defaultRoutine: RoutineTask[] = [
  { id: "1", time: "05:00", label: "Wake Up", category: "routine", completed: false, notes: "" },
  { id: "2", time: "05:10", label: "Fajr Prayer", category: "islamic", completed: false, notes: "" },
  { id: "3", time: "05:30", label: "Quran Reading", category: "islamic", completed: false, notes: "" },
  { id: "4", time: "06:00", label: "Walking / Home Exercise", category: "health", completed: false, notes: "" },
  { id: "5", time: "06:45", label: "Freshen Up", category: "routine", completed: false, notes: "" },
  { id: "6", time: "07:00", label: "Breakfast (Roti + Salan + Tea)", category: "health", completed: false, notes: "" },
  { id: "7", time: "07:30", label: "Deep Work Block 1 - Concept Learning", category: "learning", completed: false, notes: "" },
  { id: "8", time: "09:00", label: "Break", category: "personal", completed: false, notes: "" },
  { id: "9", time: "09:15", label: "Deep Work Block 2 - Coding Practice", category: "learning", completed: false, notes: "" },
  { id: "10", time: "10:45", label: "Break + Dhuhr Prayer", category: "islamic", completed: false, notes: "" },
  { id: "11", time: "11:15", label: "Deep Work Block 3 - Project Development", category: "productivity", completed: false, notes: "" },
  { id: "12", time: "12:45", label: "Lunch", category: "health", completed: false, notes: "" },
  { id: "13", time: "13:30", label: "Asr Prayer", category: "islamic", completed: false, notes: "" },
  { id: "14", time: "13:45", label: "Deep Work Block 4 - Revision / Documentation", category: "learning", completed: false, notes: "" },
  { id: "15", time: "15:15", label: "Break + Snack", category: "health", completed: false, notes: "" },
  { id: "16", time: "15:30", label: "Hands-on Practice / Projects", category: "productivity", completed: false, notes: "" },
  { id: "17", time: "17:00", label: "Maghrib Prayer", category: "islamic", completed: false, notes: "" },
  { id: "18", time: "17:15", label: "Darood-e-Pak", category: "islamic", completed: false, notes: "" },
  { id: "19", time: "17:45", label: "Bestie Time", category: "personal", completed: false, notes: "" },
  { id: "20", time: "19:45", label: "Dinner", category: "health", completed: false, notes: "" },
  { id: "21", time: "20:00", label: "Isha Prayer", category: "islamic", completed: false, notes: "" },
  { id: "22", time: "20:15", label: "Daily Review + Reflection", category: "personal", completed: false, notes: "" },
  { id: "23", time: "20:45", label: "Wind Down", category: "routine", completed: false, notes: "" },
  { id: "24", time: "21:00", label: "Sleep", category: "routine", completed: false, notes: "" },
];

const categoryColors: Record<string, string> = {
  routine: "bg-zinc-800 text-zinc-400",
  islamic: "bg-emerald-900/50 text-emerald-400",
  health: "bg-blue-900/50 text-blue-400",
  learning: "bg-purple-900/50 text-purple-400",
  personal: "bg-yellow-900/50 text-yellow-400",
  productivity: "bg-orange-900/50 text-orange-400",
};

export default function RoutinePage() {
  const [tasks, setTasks] = useState<RoutineTask[]>(defaultRoutine);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, notes } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  const morningTasks = tasks.filter((t) => {
    const h = parseInt(t.time.split(":")[0]);
    return h >= 5 && h < 12;
  });
  const afternoonTasks = tasks.filter((t) => {
    const h = parseInt(t.time.split(":")[0]);
    return h >= 12 && h < 17;
  });
  const eveningTasks = tasks.filter((t) => {
    const h = parseInt(t.time.split(":")[0]);
    return h >= 17;
  });

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
        {items.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 py-2 group rounded-lg hover:bg-zinc-800/30 px-2 -mx-2 transition-colors"
          >
            <div className="pt-0.5">
              <Checkbox
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 font-mono w-12 flex-shrink-0">
                  {task.time}
                </span>
                <span
                  className={`text-sm ${
                    task.completed
                      ? "text-zinc-500 line-through"
                      : "text-zinc-300"
                  }`}
                >
                  {task.label}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[task.category]}`}>
                  {task.category}
                </span>
              </div>
              {editingNotes === task.id ? (
                <div className="mt-2 ml-14">
                  <Input
                    value={task.notes}
                    onChange={(e) => updateNotes(task.id, e.target.value)}
                    onBlur={() => setEditingNotes(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingNotes(null)}
                    placeholder="Add note..."
                    className="h-8 text-xs"
                    autoFocus
                  />
                </div>
              ) : task.notes ? (
                <p
                  className="text-xs text-zinc-500 ml-14 mt-1 cursor-pointer hover:text-zinc-400"
                  onClick={() => setEditingNotes(task.id)}
                >
                  {task.notes}
                </p>
              ) : (
                <p
                  className="text-xs text-zinc-700 ml-14 mt-1 cursor-pointer hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setEditingNotes(task.id)}
                >
                  + Add note
                </p>
              )}
            </div>
            {task.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : null}
          </div>
        ))}
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
              {completedCount} of {tasks.length} tasks completed ({progress}%)
            </p>
          </div>
          <Button variant="outline" size="sm">
            Reset Day
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderSection(
            "Morning (5 AM - 12 PM)",
            <Sun className="h-4 w-4 text-yellow-400" />,
            morningTasks
          )}
          {renderSection(
            "Afternoon (12 PM - 5 PM)",
            <Clock className="h-4 w-4 text-orange-400" />,
            afternoonTasks
          )}
          {renderSection(
            "Evening (5 PM - 9 PM)",
            <Moon className="h-4 w-4 text-blue-400" />,
            eveningTasks
          )}
        </div>
      </div>
    </AppShell>
  );
}
