"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Calendar, Search, ArrowRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function HistoryPage() {
  const [searchDate, setSearchDate] = useState("");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/history?days=30");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        setError("Could not load your history. Please try again.");
        return;
      }
      const json = await res.json();
      const rows: DayHistory[] = (json.history || []).map((r: Record<string, unknown>) => {
        const d = new Date(`${r.date}T12:00:00`);
        return {
          date: r.date as string,
          day: DAY_NAMES[d.getDay()],
          disciplineScore: typeof r.disciplineScore === "number" ? r.disciplineScore : 0,
          tasksCompleted: typeof r.prayersCompleted === "number" ? (r.prayersCompleted as number) : 0,
          tasksTotal: 5,
          prayers: typeof r.prayersCompleted === "number" ? (r.prayersCompleted as number) : 0,
          quran: Boolean(r.quran),
          darood: typeof r.daroodCount === "number" ? (r.daroodCount as number) : 0,
          walking: Boolean(r.walking),
          workout: ((r.exerciseMins as number) || 0) > 0,
          deepWorkHours: Math.round((((r.learningMins as number) || 0) / 60) * 10) / 10,
          notes: (r.notes as string) || "",
        };
      });
      setHistory(rows);
    } catch {
      setError("Network error while loading history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const visibleDays = searchDate
    ? history.filter((d) => d.date === searchDate)
    : history;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">History</h1>
            <p className="text-sm text-muted mt-1">
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

        {loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-line border-t-accent rounded-full mx-auto mb-4" />
              <p className="text-sm text-muted">Loading your history...</p>
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-10 w-10 text-error/60 mx-auto mb-3" />
              <p className="text-sm text-error">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadHistory}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && visibleDays.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <History className="h-12 w-12 text-faint mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted">
                {searchDate ? "No records found for this date" : "No history yet"}
              </h3>
              <p className="text-sm text-faint mt-2 max-w-md mx-auto">
                Start your first day to build your progress history.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {visibleDays.map((day) => (
            <Card
              key={day.date}
              className={`cursor-pointer transition-all ${
                expandedDay === day.date ? "border-line" : "hover:border-line"
              }`}
              onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{day.day}</p>
                      <p className="text-xs text-muted">{day.date}</p>
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
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {day.tasksCompleted}/{day.tasksTotal}
                    </span>
                    <span>{day.prayers}/5 prayers</span>
                    <span>{day.deepWorkHours}h work</span>
                  </div>
                </div>

                {expandedDay === day.date && (
                  <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted mb-1">Quran</p>
                      <Badge variant={day.quran ? "success" : "destructive"}>
                        {day.quran ? "Completed" : "Missed"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">Darood</p>
                      <Badge variant={day.darood >= 33 ? "success" : "warning"}>
                        {day.darood}/33
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">Walking</p>
                      <Badge variant={day.walking ? "success" : "destructive"}>
                        {day.walking ? "Done" : "Skipped"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">Workout</p>
                      <Badge variant={day.workout ? "success" : "destructive"}>
                        {day.workout ? "Done" : "Skipped"}
                      </Badge>
                    </div>
                    {day.notes && (
                      <div className="col-span-full">
                        <p className="text-xs text-muted mb-1">Notes</p>
                        <p className="text-sm text-muted">{day.notes}</p>
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
