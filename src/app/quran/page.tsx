"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Feather, CheckCircle2, Circle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function QuranDaroodPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quranPages, setQuranPages] = useState(0);
  const [quranTarget] = useState(10);
  const [daroodCount, setDaroodCount] = useState(0);
  const [daroodTarget] = useState(33);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [week, setWeek] = useState<Array<{ date: string; label: string; quranDone: boolean; darood: number }> | null>(null);

  const loadWeek = useCallback(async () => {
    try {
      const res = await fetch("/api/history?days=7");
      if (!res.ok) return;
      const data = await res.json();
      if (!data.history) return;
      const byDate = new Map(
        (data.history as Array<{ date: string; quran?: number; daroodCount?: number }>).map((d) => [d.date, d])
      );
      const result: Array<{ date: string; label: string; quranDone: boolean; darood: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const ds = dt.toISOString().split("T")[0];
        const d = byDate.get(ds);
        result.push({
          date: ds,
          label: dt.toLocaleDateString("en-US", { weekday: "short" }),
          quranDone: (d?.quran ?? 0) > 0,
          darood: d?.daroodCount ?? 0,
        });
      }
      setWeek(result);
    } catch {
      /* non-critical */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, dRes] = await Promise.all([
        fetch(`/api/quran?date=${todayStr()}`),
        fetch(`/api/darood?date=${todayStr()}`),
      ]);
      if (!qRes.ok || !dRes.ok) throw new Error();
      const qData = await qRes.json();
      const dData = await dRes.json();
      setQuranPages(qData.record?.pagesRead ?? 0);
      setDaroodCount(dData.record?.count ?? 0);
      loadWeek();
    } catch {
      setError("Failed to load today's records. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [loadWeek]);

  useEffect(() => {
    load();
  }, [load]);

  const saveQuran = async (nextPages: number) => {
    const clamped = Math.max(0, Math.min(604, nextPages));
    const prev = quranPages;
    setSavingKey("quran");
    setError(null);
    setQuranPages(clamped);
    try {
      const res = await fetch("/api/quran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagesRead: clamped }),
      });
      if (!res.ok) throw new Error();
      loadWeek();
    } catch {
      setQuranPages(prev);
      setError("Could not save Quran reading. Try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const saveDarood = async (next: number) => {
    const clamped = Math.max(0, Math.min(9999, next));
    const prev = daroodCount;
    setSavingKey("darood");
    setError(null);
    setDaroodCount(clamped);
    try {
      const res = await fetch("/api/darood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: clamped }),
      });
      if (!res.ok) throw new Error();
      loadWeek();
    } catch {
      setDaroodCount(prev);
      setError("Could not save Darood count. Try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const quranProgress = Math.round((quranPages / quranTarget) * 100);
  const daroodProgress = Math.round((daroodCount / daroodTarget) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Quran & Darood-e-Pak</h1>
          <p className="text-sm text-zinc-500 mt-1">Daily spiritual routine tracking</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="p-6 text-sm text-zinc-500">Loading…</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-400" />
                      Quran Reading
                    </CardTitle>
                    <Badge variant={quranProgress >= 100 ? "success" : "secondary"}>
                      {quranPages} / {quranTarget} pages
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={Math.min(100, quranProgress)} variant={quranProgress >= 100 ? "success" : "default"} />
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" disabled={quranPages === 0 || savingKey === "quran"} onClick={() => saveQuran(quranPages - 1)}>-1</Button>
                    <Input
                      type="number"
                      value={quranPages}
                      onChange={(e) => saveQuran(parseInt(e.target.value) || 0)}
                      onBlur={() => saveQuran(quranPages)}
                      className="w-20 text-center"
                    />
                    <Button variant="outline" size="sm" disabled={savingKey === "quran"} onClick={() => saveQuran(quranPages + 1)}>+1</Button>
                  </div>
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">Tip: Even reading 1 page daily maintains consistency.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Feather className="h-4 w-4 text-yellow-400" />
                      Darood-e-Pak
                    </CardTitle>
                    <Badge variant={daroodProgress >= 100 ? "success" : "secondary"}>
                      {daroodCount} / {daroodTarget}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={Math.min(100, daroodProgress)} variant={daroodProgress >= 100 ? "success" : "default"} />
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" disabled={daroodCount === 0 || savingKey === "darood"} onClick={() => saveDarood(daroodCount - 1)}>-1</Button>
                    <Input
                      type="number"
                      value={daroodCount}
                      onChange={(e) => saveDarood(parseInt(e.target.value) || 0)}
                      onBlur={() => saveDarood(daroodCount)}
                      className="w-20 text-center"
                    />
                    <Button variant="outline" size="sm" disabled={savingKey === "darood"} onClick={() => saveDarood(daroodCount + 1)}>+1</Button>
                  </div>
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">After Maghrib is the dedicated Darood time. Target: 33 daily.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                {!week ? (
                  <p className="text-sm text-zinc-500">No history yet.</p>
                ) : week.every((d) => !d.quranDone && d.darood === 0) ? (
                  <p className="text-sm text-zinc-500">Track your reading and Darood to build this view.</p>
                ) : (
                  <div className="grid grid-cols-7 gap-3">
                    {week.map((day) => (
                      <div key={day.date} className="text-center p-3 rounded-lg bg-zinc-800/50 space-y-2">
                        <div className="text-xs text-zinc-500 font-medium">{day.label}</div>
                        <div className="flex justify-center">
                          {day.quranDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                        <div className={`text-xs ${day.darood >= 33 ? "text-emerald-400" : day.darood > 0 ? "text-yellow-500" : "text-zinc-600"}`}>
                          {day.darood}/33
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}