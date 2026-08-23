"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Calendar, Search, ArrowRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";

interface DayHistory {
  date: string;
  day: string;
  disciplineScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  prayers: number;
  quran: boolean;
  darood: number;
  walking: boolean;
  workout: boolean;
  deepWorkHours: number;
  notes: string;
}

const mockHistory: DayHistory[] = [
  { date: "2026-08-23", day: "Sunday", disciplineScore: 65, tasksCompleted: 5, tasksTotal: 8, prayers: 4, quran: false, darood: 11, walking: true, workout: false, deepWorkHours: 5, notes: "Light day" },
  { date: "2026-08-22", day: "Saturday", disciplineScore: 72, tasksCompleted: 6, tasksTotal: 8, prayers: 5, quran: true, darood: 33, walking: true, workout: true, deepWorkHours: 7, notes: "" },
  { date: "2026-08-21", day: "Friday", disciplineScore: 78, tasksCompleted: 7, tasksTotal: 8, prayers: 5, quran: true, darood: 33, walking: true, workout: true, deepWorkHours: 8, notes: "" },
  { date: "2026-08-20", day: "Thursday", disciplineScore: 70, tasksCompleted: 5, tasksTotal: 8, prayers: 5, quran: true, darood: 22, walking: true, workout: false, deepWorkHours: 6, notes: "Tired today" },
  { date: "2026-08-19", day: "Wednesday", disciplineScore: 88, tasksCompleted: 8, tasksTotal: 8, prayers: 5, quran: true, darood: 33, walking: true, workout: true, deepWorkHours: 9, notes: "Great day!" },
  { date: "2026-08-18", day: "Tuesday", disciplineScore: 75, tasksCompleted: 6, tasksTotal: 8, prayers: 5, quran: true, darood: 33, walking: true, workout: true, deepWorkHours: 7, notes: "" },
  { date: "2026-08-17", day: "Monday", disciplineScore: 82, tasksCompleted: 7, tasksTotal: 8, prayers: 5, quran: true, darood: 33, walking: true, workout: true, deepWorkHours: 8.5, notes: "" },
];

export default function HistoryPage() {
  const [searchDate, setSearchDate] = useState("");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">History</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Your complete daily records - nothing disappears
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Find
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {mockHistory.map((day) => (
            <Card
              key={day.date}
              className={`cursor-pointer transition-all ${
                expandedDay === day.date ? "border-zinc-700" : "hover:border-zinc-800"
              }`}
              onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{day.day}</p>
                      <p className="text-xs text-zinc-500">{day.date}</p>
                    </div>
                    <Badge
                      variant={
                        day.disciplineScore >= 80
                          ? "success"
                          : day.disciplineScore >= 60
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {day.disciplineScore}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {day.tasksCompleted}/{day.tasksTotal}
                    </span>
                    <span>{day.prayers}/5 prayers</span>
                    <span>{day.deepWorkHours}h work</span>
                  </div>
                </div>

                {expandedDay === day.date && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Quran</p>
                      <Badge variant={day.quran ? "success" : "destructive"}>
                        {day.quran ? "Completed" : "Missed"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Darood</p>
                      <Badge variant={day.darood >= 33 ? "success" : "warning"}>
                        {day.darood}/33
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Walking</p>
                      <Badge variant={day.walking ? "success" : "destructive"}>
                        {day.walking ? "Done" : "Skipped"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Workout</p>
                      <Badge variant={day.workout ? "success" : "destructive"}>
                        {day.workout ? "Done" : "Skipped"}
                      </Badge>
                    </div>
                    {day.notes && (
                      <div className="col-span-full">
                        <p className="text-xs text-zinc-500 mb-1">Notes</p>
                        <p className="text-sm text-zinc-400">{day.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
