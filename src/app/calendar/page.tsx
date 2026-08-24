"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, MinusCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface HistoryRow {
  date: string;
  disciplineScore?: number;
  dayScore?: number | null;
  prayersCompleted?: number;
  quran?: boolean;
  pagesRead?: number;
  daroodCount?: number;
  walking?: boolean;
  steps?: number;
  exerciseMins?: number;
  learningMins?: number;
  sessions?: Array<{ mins: number; at: string }>;
  reviewed?: boolean;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  waterGlasses?: number;
  waterTarget?: number;
  mealsLogged?: number;
  habitsDone?: number;
  habitsPlanned?: number;
  projectsTouched?: string[];
  weightKg?: number;
}

type Category = "faith" | "learning" | "health" | "routine" | "review";

const CATEGORY_META: Record<Category, { label: string; cls: string }> = {
  faith: { label: "Faith", cls: "bg-faith" },
  learning: { label: "Learning", cls: "bg-accent" },
  health: { label: "Health", cls: "bg-success" },
  routine: { label: "Routine", cls: "bg-warning" },
  review: { label: "Review", cls: "bg-ink" },
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function categoriesOf(r: HistoryRow | undefined): Category[] {
  if (!r) return [];
  const out: Category[] = [];
  if ((r.prayersCompleted ?? 0) > 0 || r.quran || (r.daroodCount ?? 0) > 0) out.push("faith");
  if ((r.learningMins ?? 0) > 0) out.push("learning");
  if (r.walking || (r.exerciseMins ?? 0) > 0 || (r.waterGlasses ?? 0) > 0 || r.sleepHours != null)
    out.push("health");
  if ((r.habitsDone ?? 0) > 0 || (r.mealsLogged ?? 0) > 0) out.push("routine");
  if (r.reviewed) out.push("review");
  return out;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth()));
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [rows, setRows] = useState<Record<string, HistoryRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/history?days=120");
        if (!cancelled) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          if (!res.ok) {
            setError("Could not load calendar records.");
            return;
          }
          const json = await res.json();
          const map: Record<string, HistoryRow> = {};
          for (const r of json.history || []) map[r.date] = r;
          setRows(map);
        }
      } catch {
        if (!cancelled) setError("Network error while loading calendar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const selectedRecord = rows[dateKey(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate)];

  const fmtFull = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Calendar</h1>
          <p className="text-sm text-muted mt-1">Click any date to see its full daily record.</p>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-line border-t-accent rounded-full mx-auto mb-4" />
              <p className="text-sm text-muted">Loading calendar...</p>
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-error">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Month grid */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Previous month"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-base">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Next month"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <div key={day} className="text-center text-[11px] font-medium text-faint py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const key = dateKey(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const record = rows[key];
                      const cats = categoriesOf(record);
                      const isSelected = selectedDate === day;
                      const isToday =
                        day === today.getDate() &&
                        currentMonth.getMonth() === today.getMonth() &&
                        currentMonth.getFullYear() === today.getFullYear();

                      const summary = cats.length > 0 ? cats.map((c) => CATEGORY_META[c].label).join(", ") : "No tracking recorded";

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(day)}
                          aria-label={`${monthNames[currentMonth.getMonth()]} ${day}: ${summary}`}
                          aria-current={isSelected ? "date" : undefined}
                          className={`relative flex min-h-[52px] flex-col items-center justify-start rounded-lg px-1 py-1.5 transition-colors ${
                            isSelected ? "bg-accent-tint ring-1 ring-accent/30" : "hover:bg-surface2/60"
                          }`}
                        >
                          <span className={`text-[13px] leading-none ${isToday ? "font-bold text-ink" : "text-muted"}`}>
                            {day}
                          </span>
                          <div className="mt-1 flex min-h-[6px] flex-wrap items-center justify-center gap-[3px]">
                            {(cats.length > 0 ? cats : []).map((c) => (
                              <span
                                key={c}
                                title={CATEGORY_META[c].label}
                                className={`h-1.5 w-1.5 rounded-full ${CATEGORY_META[c].cls}`}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3">
                    {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                      <span key={c} className="flex items-center gap-1.5 text-[11px] text-muted">
                        <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_META[c].cls}`} aria-hidden="true" />
                        {CATEGORY_META[c].label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily history panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base leading-snug">
                    {fmtFull(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedRecord ? (
                    <div className="py-10 text-center">
                      <CalendarDays className="mx-auto mb-3 h-9 w-9 text-faint" aria-hidden="true" />
                      <p className="text-sm text-muted">No tracking recorded.</p>
                    </div>
                  ) : (
                    <DailyHistory r={selectedRecord} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section aria-label={label}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</h3>
      <div className="mt-1.5 space-y-1">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted">{k}</span>
      <span className="truncate text-right font-medium text-ink">{v}</span>
    </div>
  );
}

function YesNo({ yes }: { yes: boolean }) {
  return yes ? (
    <CheckCircle2 className="inline h-4 w-4 align-text-bottom text-success" aria-label="Yes" />
  ) : (
    <MinusCircle className="inline h-4 w-4 align-text-bottom text-faint" aria-label="No" />
  );
}

function DailyHistory({ r }: { r: HistoryRow }) {
  const scores: string[] = [];
  if (r.dayScore != null) scores.push(`Self-rated ${r.dayScore}/10`);
  if (r.disciplineScore != null) scores.push(`Discipline ${r.disciplineScore}%`);

  const waterTarget = r.waterTarget ?? 8;

  return (
    <div className="space-y-4">
      <Section label="Daily score">
        {scores.length > 0 ? (
          scores.map((s) => (
            <Row key={s} k={s.split(" ")[0]} v={s.split(" ").slice(1).join(" ")} />
          ))
        ) : (
          <p className="text-sm text-muted">Not scored</p>
        )}
      </Section>

      <Section label="Faith">
        <Row k="Prayers" v={`${r.prayersCompleted ?? 0}/5`} />
        <Row k="Quran" v={<span>{<YesNo yes={!!r.quran} />}{r.pagesRead ? ` ${r.pagesRead}p` : ""}</span>} />
        <Row k="Darood" v={`${r.daroodCount ?? 0}`} />
      </Section>

      <Section label="Learning">
        <Row k="Time" v={r.learningMins ? `${(r.learningMins / 60).toFixed(1)}h` : "None logged"} />
        {r.sessions && r.sessions.length > 0 && <Row k="Sessions" v={String(r.sessions.length)} />}
      </Section>

      <Section label="Health">
        <Row k="Walk" v={<YesNo yes={!!r.walking} />} />
        <Row k="Workout" v={r.exerciseMins ? `${r.exerciseMins}m` : <YesNo yes={false} />} />
        <Row k="Water" v={r.waterGlasses != null ? `${r.waterGlasses}/${waterTarget}` : "—"} />
        <Row k="Sleep" v={r.sleepHours != null && r.sleepHours > 0 ? `${r.sleepHours}h` : "—"} />
        {r.weightKg != null && <Row k="Weight" v={`${r.weightKg.toFixed(1)} kg`} />}
      </Section>

      <Section label="Routine">
        <Row
          k="Habits"
          v={r.habitsPlanned != null ? `${r.habitsDone ?? 0}/${r.habitsPlanned}` : r.habitsDone ? String(r.habitsDone) : "—"}
        />
        <Row k="Meals" v={r.mealsLogged != null ? `${r.mealsLogged} logged` : "—"} />
      </Section>

      <Section label="Projects">
        {r.projectsTouched && r.projectsTouched.length > 0 ? (
          r.projectsTouched.map((t) => <Row key={t} k="Updated" v={t} />)
        ) : (
          <p className="text-sm text-muted">No project activity recorded.</p>
        )}
      </Section>

      <Section label="Review">
        {r.reviewed ? (
          <Row k="Written" v={<CheckCircle2 className="inline h-4 w-4 align-text-bottom text-success" aria-label="Review written" />} />
        ) : (
          <p className="text-sm text-muted">No review written.</p>
        )}
      </Section>
    </div>
  );
}
