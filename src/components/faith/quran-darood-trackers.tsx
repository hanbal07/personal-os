"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle2, Circle, Feather } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

const todayStr = () => new Date().toISOString().split("T")[0];

interface WeekDay {
  date: string;
  label: string;
  quranDone: boolean;
  quranPages: number;
  darood: number;
}

export function QuranDaroodTrackers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quranPages, setQuranPages] = useState(0);
  const [quranTarget] = useState(10);
  const [daroodCount, setDaroodCount] = useState(0);
  const [daroodTarget] = useState(33);
  const [quranMins, setQuranMins] = useState<number | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [week, setWeek] = useState<WeekDay[] | null>(null);
  const [quranDraft, setQuranDraft] = useState("0");
  const [daroodDraft, setDaroodDraft] = useState("0");
  const [minsDraft, setMinsDraft] = useState("");
  const quranTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const daroodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadWeek = useCallback(async () => {
    try {
      const res = await fetch("/api/history?days=7");
      if (!res.ok) return;
      const data = await res.json();
      if (!data.history) return;
      const byDate = new Map(
        (data.history as Array<{ date: string; quran?: number; daroodCount?: number }>).map((d) => [d.date, d])
      );
      const result: WeekDay[] = [];
      for (let i = 6; i >= 0; i--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const ds = dt.toISOString().split("T")[0];
        const d = byDate.get(ds);
        result.push({
          date: ds,
          label: dt.toLocaleDateString("en-US", { weekday: "short" }),
          quranDone: (d?.quran ?? 0) > 0,
          quranPages: d?.quran ?? 0,
          darood: d?.daroodCount ?? 0,
        });
      }
      setWeek(result);
    } catch {
      /* non-critical */
    }
  }, []);

  const load = useCallback(async () => {
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
      setQuranMins(qData.record?.durationMins ?? null);
      setQuranDraft(String(qData.record?.pagesRead ?? 0));
      setMinsDraft(qData.record?.durationMins ? String(qData.record.durationMins) : "");
      setDaroodCount(dData.record?.count ?? 0);
      setDaroodDraft(String(dData.record?.count ?? 0));
      loadWeek();
    } catch {
      setError("Couldn't load today's records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loadWeek]);

  useEffect(() => {
    load();
  }, [load]);

  const saveQuran = async (nextPages: number, duration?: number | null) => {
    const clamped = Math.max(0, Math.min(604, nextPages));
    const prevPages = quranPages;
    setSavingKey("quran");
    setError(null);
    setQuranPages(clamped);
    setQuranDraft(String(clamped));
    try {
      const body: Record<string, unknown> = { pagesRead: clamped };
      const dur = duration === undefined ? (minsDraft ? parseInt(minsDraft, 10) : null) : duration;
      if (dur !== null && Number.isInteger(dur) && dur > 0 && dur <= 600) body.durationMins = dur;
      const res = await fetch("/api/quran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      loadWeek();
    } catch {
      setQuranPages(prevPages);
      setQuranDraft(String(prevPages));
      setError("Couldn't save Quran reading. Try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const saveMins = async () => {
    const n = parseInt(minsDraft, 10);
    await saveQuran(quranPages, Number.isInteger(n) && n > 0 ? n : null);
  };

  const saveDarood = async (next: number) => {
    const clamped = Math.max(0, Math.min(9999, next));
    const prev = daroodCount;
    setSavingKey("darood");
    setError(null);
    setDaroodCount(clamped);
    setDaroodDraft(String(clamped));
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
      setDaroodDraft(String(prev));
      setError("Couldn't save Darood count. Try again.");
    } finally {
      setSavingKey(null);
    }
  };

  // Debounced auto-save — no POST per keystroke.
  useEffect(() => {
    if (loading) return;
    const n = parseInt(quranDraft, 10);
    if (Number.isNaN(n) || n === quranPages) return;
    quranTimerRef.current = setTimeout(() => saveQuran(n), 800);
    return () => {
      if (quranTimerRef.current) clearTimeout(quranTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quranDraft, loading]);

  useEffect(() => {
    if (loading) return;
    const n = parseInt(daroodDraft, 10);
    if (Number.isNaN(n) || n === daroodCount) return;
    daroodTimerRef.current = setTimeout(() => saveDarood(n), 800);
    return () => {
      if (daroodTimerRef.current) clearTimeout(daroodTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daroodDraft, loading]);

  const commitQuranDraft = () => {
    const n = parseInt(quranDraft, 10);
    if (!Number.isNaN(n) && n !== quranPages) {
      if (quranTimerRef.current) clearTimeout(quranTimerRef.current);
      saveQuran(n);
    }
  };

  const commitDaroodDraft = () => {
    const n = parseInt(daroodDraft, 10);
    if (!Number.isNaN(n) && n !== daroodCount) {
      if (daroodTimerRef.current) clearTimeout(daroodTimerRef.current);
      saveDarood(n);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-10 w-44 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const quranProgress = Math.round((quranPages / quranTarget) * 100);
  const daroodProgress = Math.round((daroodCount / daroodTarget) * 100);

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-faith" />
                Quran Reading
              </CardTitle>
              <Badge variant={quranProgress >= 100 ? "success" : quranPages > 0 ? "warning" : "secondary"}>
                {quranPages} / {quranTarget} pages
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={Math.min(100, quranProgress)} variant={quranProgress >= 100 ? "success" : "default"} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Decrease pages by one"
                disabled={quranPages === 0 || savingKey === "quran"}
                onClick={() => saveQuran(quranPages - 1)}
              >
                −1
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                value={quranDraft}
                onChange={(e) => setQuranDraft(e.target.value)}
                onBlur={commitQuranDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="w-20 text-center"
                aria-label="Pages read today (saves automatically)"
              />
              <Button
                variant="outline"
                size="sm"
                aria-label="Increase pages by one"
                disabled={savingKey === "quran"}
                onClick={() => saveQuran(quranPages + 1)}
              >
                +1
              </Button>
              {savingKey === "quran" && <span className="text-xs text-faint">Saving…</span>}
            </div>
            <div className="flex items-center gap-2 border-t border-line pt-3">
              <label htmlFor="quran-mins" className="text-xs text-muted">Duration (min)</label>
              <Input
                id="quran-mins"
                type="number"
                inputMode="numeric"
                value={minsDraft}
                onChange={(e) => setMinsDraft(e.target.value)}
                onBlur={saveMins}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder="—"
                className="h-8 w-16 text-center text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Feather className="h-4 w-4 text-faith" />
                Darood-e-Pak
              </CardTitle>
              <Badge variant={daroodProgress >= 100 ? "success" : daroodCount > 0 ? "warning" : "secondary"}>
                {daroodCount} / {daroodTarget}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={Math.min(100, daroodProgress)} variant={daroodProgress >= 100 ? "success" : "default"} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Decrease count by one"
                disabled={daroodCount === 0 || savingKey === "darood"}
                onClick={() => saveDarood(daroodCount - 1)}
              >
                −1
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                value={daroodDraft}
                onChange={(e) => setDaroodDraft(e.target.value)}
                onBlur={commitDaroodDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="w-20 text-center"
                aria-label="Darood count today (saves automatically)"
              />
              <Button
                variant="outline"
                size="sm"
                aria-label="Increase count by one"
                disabled={savingKey === "darood"}
                onClick={() => saveDarood(daroodCount + 1)}
              >
                +1
              </Button>
              {savingKey === "darood" && <span className="text-xs text-faint">Saving…</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[11, 33].map((n) => (
                <Button
                  key={n}
                  variant="secondary"
                  size="sm"
                  aria-label={`Add ${n} to Darood count`}
                  disabled={savingKey === "darood"}
                  onClick={() => saveDarood(daroodCount + n)}
                >
                  +{n}
                </Button>
              ))}
              <span className="text-xs text-faint">one tasbeeh = +33</span>
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
            <p className="text-sm text-muted">No history yet.</p>
          ) : week.every((d) => !d.quranDone && d.darood === 0) ? (
            <p className="text-sm text-muted">
              Track your reading and Darood to build this weekly view.
            </p>
          ) : (
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {week.map((day) => (
                <div key={day.date} className="space-y-1.5 rounded-lg bg-surface2 p-2 text-center sm:p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-faint">{day.label}</div>
                  <div className="flex justify-center">
                    {day.quranDone ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Circle className="h-4 w-4 text-line" />
                    )}
                  </div>
                  <div
                    className={`text-[11px] ${
                      day.darood >= 33 ? "font-semibold text-success" : day.darood > 0 ? "text-warning" : "text-faint"
                    }`}
                  >
                    {day.darood}/33
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function QuranTracker() {
  return <QuranDaroodTrackers />;
}
