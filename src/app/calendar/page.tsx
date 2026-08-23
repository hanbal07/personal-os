"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useState } from "react";

interface DayRecord {
  date: number;
  disciplineScore: number;
  prayers: number;
  quran: boolean;
  darood: number;
  walking: boolean;
  workout: boolean;
  meals: number;
  deepWorkHours: number;
  tasks: { total: number; completed: number };
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 7));
  const [selectedDate, setSelectedDate] = useState<number | null>(23);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const generateMockData = (day: number): DayRecord => {
    const scores = [82, 75, 88, 70, 78, 65, 55, 80, 72, 85, 68, 74, 90, 60];
    return {
      date: day,
      disciplineScore: scores[day % scores.length],
      prayers: day % 7 === 0 ? 3 : 5,
      quran: day % 5 !== 0,
      darood: day % 7 === 0 ? 11 : 33,
      walking: day % 4 !== 0,
      workout: day % 3 !== 0,
      meals: day % 6 === 0 ? 2 : 4,
      deepWorkHours: day % 7 === 0 ? 4 : 8,
      tasks: { total: 8, completed: day % 7 === 0 ? 3 : 7 },
    };
  };

  const selectedRecord = selectedDate ? generateMockData(selectedDate) : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Click any date to view the full daily record
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs text-zinc-500 py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const record = generateMockData(day);
                    const isSelected = selectedDate === day;
                    const isToday = day === 23;

                    const scoreColor =
                      record.disciplineScore >= 80
                        ? "text-emerald-400"
                        : record.disciplineScore >= 60
                        ? "text-yellow-400"
                        : "text-red-400";

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`relative p-2 rounded-lg text-center transition-all ${
                          isSelected
                            ? "bg-white/10 ring-1 ring-white/20"
                            : "hover:bg-zinc-800/50"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            isToday
                              ? "font-bold text-white"
                              : "text-zinc-400"
                          }`}
                        >
                          {day}
                        </span>
                        <div className={`text-[10px] mt-0.5 ${scoreColor}`}>
                          {record.disciplineScore}%
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedRecord && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  August {selectedRecord.date}, 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Discipline Score</span>
                    <Badge variant="secondary">{selectedRecord.disciplineScore}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Prayers</span>
                    <span className="text-sm text-white">
                      {selectedRecord.prayers}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Quran</span>
                    {selectedRecord.quran ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Darood</span>
                    <span className="text-sm text-white">
                      {selectedRecord.darood}/33
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Walking</span>
                    {selectedRecord.walking ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Workout</span>
                    {selectedRecord.workout ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Meals</span>
                    <span className="text-sm text-white">
                      {selectedRecord.meals}/4
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Deep Work</span>
                    <span className="text-sm text-white">
                      {selectedRecord.deepWorkHours}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Tasks</span>
                    <span className="text-sm text-white">
                      {selectedRecord.tasks.completed}/{selectedRecord.tasks.total}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  <Button variant="outline" size="sm" className="w-full">
                    View Full Day
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
