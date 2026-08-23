"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface DayRecord {
  date: string;
  disciplineScore: number;
  prayers: number;
  quran: boolean;
  darood: number;
  walking: boolean;
  workout: boolean;
  meals: number;
  deepWorkHours: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth()));
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/history?days=120");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) {
          setError("Could not load calendar records.");
          return;
        }
        const json = await res.json();
        const map: Record<string, DayRecord> = {};
        for (const r of json.history || []) {
          map[r.date] = r;
        }
        setRecords(map);
      } catch {
        setError("Network error while loading calendar.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const selectedRecord = selectedDate
    ? records[dateKey(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate)]
    : undefined;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Click any date to view the full daily record
          </p>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full mx-auto mb-4" />
              <p className="text-sm text-zinc-400">Loading calendar...</p>
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-400/60 mx-auto mb-3" />
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
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
                    const key = dateKey(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const record = records[key];
                    const isSelected = selectedDate === day;
                    const isToday =
                      day === today.getDate() &&
                      currentMonth.getMonth() === today.getMonth() &&
                      currentMonth.getFullYear() === today.getFullYear();

                    const scoreColor =
                      record && record.disciplineScore >= 80
                        ? "text-emerald-400"
                        : record && record.disciplineScore >= 60
                        ? "text-yellow-400"
                        : record
                        ? "text-red-400"
                        : "text-zinc-700";

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
                          {record ? `${record.disciplineScore}%` : "·"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {monthNames[currentMonth.getMonth()]} {selectedDate}, {currentMonth.getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRecord ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Discipline Score</span>
                      <Badge variant="secondary">{selectedRecord.disciplineScore ?? 0}%</Badge>
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
                      <span className="text-sm text-zinc-400">Learning</span>
                      <span className="text-sm text-white">
                        {selectedRecord.deepWorkHours}h
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800">
                    <Button variant="outline" size="sm" className="w-full">
                      View Full Day
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <CalendarIcon className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No data recorded for this date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </AppShell>
  );
}