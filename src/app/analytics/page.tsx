"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Clock,
  Target,
  MoonStar,
  HeartPulse,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";

// Design palette — slate blue, soft sage, muted amber, muted red, neutral gray
const CHART = {
  slate: "#5B6C8F",
  sage: "#7C9070",
  amber: "#B98A2F",
  red: "#B0563F",
  gray: "#8A8A82",
};
const PALETTE = [CHART.slate, CHART.sage, CHART.amber, CHART.red, CHART.gray];
const GRID = "#E7E7E3";
const AXIS = "#77776F";

interface HistoryRow {
  date: string;
  disciplineScore?: number;
  dayScore?: number;
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
  waterGlasses?: number;
  waterTarget?: number;
  mealsLogged?: number;
  habitsDone?: number;
  habitsPlanned?: number;
  projectsTouched?: string[];
  weightKg?: number;
}

interface Summary {
  totalLearningHours: number;
  avgDailyLearning: number;
  avgDiscipline: number;
  completedProjects: number;
  activeProjects: number;
  prayerCompleted: number;
  prayerTotal: number;
  walkingCompleted: number;
  exerciseCompleted: number;
  avgSleep: number;
  totalDays: number;
}

interface Insight {
  tone: "good" | "bad";
  text: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<Array<{ day: string; hours: number }>>([]);
  const [disciplineTrend, setDisciplineTrend] = useState<Array<{ day: string; score: number }>>([]);
  const [skillDistribution, setSkillDistribution] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [failureReasons, setFailureReasons] = useState<Array<{ reason: string; count: number }>>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [skillProgress, setSkillProgress] = useState<
    Array<{ name: string; progress: number; hours: number; lastStudied: string | null }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [aRes, sRes, hRes] = await Promise.all([
          fetch("/api/analytics?days=7"),
          fetch("/api/skills"),
          fetch("/api/history?days=28"),
        ]);
        if (!aRes.ok) throw new Error();
        const a = await aRes.json();
        if (cancelled) return;

        const fmtDay = (d: string) =>
          new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });

        setWeeklyHours((a.weeklyHours || []).map((x: { day: string; hours: number }) => ({ ...x, day: fmtDay(x.day) })));
        setDisciplineTrend((a.disciplineTrend || []).map((x: { day: string; score: number }) => ({ ...x, day: fmtDay(x.day) })));
        setSkillDistribution(
          (a.skillDistribution || [])
            .filter((x: { value: number }) => x.value > 0)
            .map((x: { name: string; value: number }, i: number) => ({ ...x, color: PALETTE[i % PALETTE.length] }))
        );
        setFailureReasons(a.failureReasons || []);
        setSummary(a.summary || null);

        if (hRes.ok) {
          const h = await hRes.json();
          if (!cancelled) setHistory((h.history || []) as HistoryRow[]);
        }
        if (sRes.ok) {
          const s = await sRes.json();
          if (!cancelled)
            setSkillProgress(
              (s.skills || []).map(
                (sk: { name: string; progress: number; practiceHours: number; lastStudied: string | null }) => ({
                  name: sk.name,
                  progress: sk.progress,
                  hours: sk.practiceHours,
                  lastStudied: sk.lastStudied,
                })
              )
            );
        }
      } catch {
        if (!cancelled) setError("Failed to load insights. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived metrics (real records only) ──────────────────────────
  const last7 = history.slice(0, 7);

  const weekMetrics = (() => {
    const daysTracked = last7.length;
    const learningMins = last7.reduce((s, r) => s + (r.learningMins || 0), 0);
    const learningDays = last7.filter((r) => (r.learningMins || 0) >= 15).length;
    const prayersDone = last7.reduce((s, r) => s + (r.prayersCompleted || 0), 0);
    const prayerRows = last7.reduce((s, r) => s + (r.prayersCompleted != null ? 5 : 0), 0);
    const walkDays = last7.filter((r) => r.walking).length;
    const sleepNights = last7.filter((r) => r.sleepHours != null && r.sleepHours > 0);
    const sleepAvg =
      sleepNights.length > 0 ? sleepNights.reduce((s, r) => s + (r.sleepHours || 0), 0) / sleepNights.length : null;
    const waterTarget = last7.find((r) => r.waterTarget)?.waterTarget ?? 8;
    const waterDays = last7.filter((r) => (r.waterGlasses || 0) >= waterTarget && r.waterGlasses != null).length;
    const habitsDone = last7.reduce((s, r) => s + (r.habitsDone || 0), 0);
    const habitsPlanned = last7.reduce((s, r) => s + (r.habitsPlanned || 0), 0);
    const reviews = last7.filter((r) => r.reviewed).length;
    const scoredDays = last7.filter((r) => r.dayScore != null);
    const dayScoreAvg =
      scoredDays.length > 0 ? scoredDays.reduce((s, r) => s + (r.dayScore || 0), 0) / scoredDays.length : null;
    const workoutDays = last7.filter((r) => (r.exerciseMins || 0) > 0).length;
    return {
      daysTracked,
      learningHours: Math.round((learningMins / 60) * 10) / 10,
      learningDays,
      prayersDone,
      prayerRows,
      prayerPct: prayerRows > 0 ? Math.round((prayersDone / prayerRows) * 100) : null,
      walkDays,
      walkPct: daysTracked > 0 ? Math.round((walkDays / daysTracked) * 100) : null,
      sleepAvg: sleepAvg != null ? Math.round(sleepAvg * 10) / 10 : null,
      sleepNights: sleepNights.length,
      waterDays,
      waterTarget,
      habitsDone,
      habitsPlanned,
      habitPct: habitsPlanned > 0 ? Math.round((habitsDone / habitsPlanned) * 100) : null,
      reviews,
      dayScoreAvg: dayScoreAvg != null ? Math.round(dayScoreAvg * 10) / 10 : null,
      scoredDays: scoredDays.length,
      workoutDays,
    };
  })();

  const patterns = (() => {
    const out: string[] = [];

    // Morning vs afternoon/evening study split (needs ≥4 sessions)
    const allSessions = history.flatMap((r) => r.sessions || []);
    if (allSessions.length >= 4) {
      let amMins = 0;
      let pmMins = 0;
      for (const s of allSessions) {
        const hr = new Date(s.at).getHours();
        if (hr >= 4 && hr < 12) amMins += s.mins;
        else pmMins += s.mins;
      }
      const total = amMins + pmMins;
      if (total > 0) {
        const amShare = Math.round((amMins / total) * 100);
        if (amShare >= 65) out.push(`Most of your study time (${amShare}%) happens before noon.`);
        else if (amShare <= 35) out.push(`Most of your study time (${100 - amShare}%) happens in the afternoon or evening.`);
        else out.push("Your study time is fairly balanced between morning and later in the day.");
      }
    }

    // Weekday habit pattern over the longer window (needs ≥8 tracked days with plans)
    const plannedDays = history.filter((r) => (r.habitsPlanned || 0) > 0);
    if (plannedDays.length >= 8) {
      const byDay = new Map<number, { done: number; planned: number }>();
      for (const r of plannedDays) {
        const wd = new Date(`${r.date}T12:00:00`).getDay();
        const cur = byDay.get(wd) || { done: 0, planned: 0 };
        cur.done += r.habitsDone || 0;
        cur.planned += r.habitsPlanned || 0;
        byDay.set(wd, cur);
      }
      const ranked = [...byDay.entries()]
        .filter(([, v]) => v.planned >= 4)
        .map(([wd, v]) => ({
          wd,
          pct: Math.round((v.done / v.planned) * 100),
        }))
        .sort((a, b) => b.pct - a.pct);
      if (ranked.length >= 2 && ranked[0].pct - ranked[ranked.length - 1].pct >= 20) {
        const dayName = (n: number) => new Date(2024, 0, 7 + n).toLocaleDateString("en-US", { weekday: "long" });
        out.push(
          `Routine follow-through is strongest on ${dayName(ranked[0].wd)} (${ranked[0].pct}%) and weakest on ${dayName(
            ranked[ranked.length - 1].wd
          )} (${ranked[ranked.length - 1].pct}%).`
        );
      }
    }

    // Sleep vs next-day output (needs ≥3 pairs in each bucket)
    const chrono = [...history].sort((a, b) => a.date.localeCompare(b.date));
    const goodNext: number[] = [];
    const poorNext: number[] = [];
    for (let i = 0; i < chrono.length - 1; i++) {
      const sleep = chrono[i].sleepHours;
      const nextLearning = (chrono[i + 1].learningMins || 0) / 60;
      if (sleep == null || sleep <= 0) continue;
      (sleep >= 7 ? goodNext : poorNext).push(nextLearning);
    }
    if (goodNext.length >= 3 && poorNext.length >= 3) {
      const g = goodNext.reduce((a, b) => a + b, 0) / goodNext.length;
      const p = poorNext.reduce((a, b) => a + b, 0) / poorNext.length;
      const diff = Math.round(Math.abs(g - p) * 10) / 10;
      if (diff >= 0.5) {
        out.push(
          g > p
            ? `After 7+ hours of sleep you average ${diff}h more study the next day.`
            : `After shorter nights you averaged ${diff}h more study the next day — worth watching.`
        );
      }
    }

    // Day score direction (needs ≥6 scored days in window)
    const scored = chrono.filter((r) => r.dayScore != null);
    if (scored.length >= 6) {
      const half = Math.floor(scored.length / 2);
      const first = scored.slice(0, half).reduce((s, r) => s + (r.dayScore || 0), 0) / half;
      const second = scored.slice(half).reduce((s, r) => s + (r.dayScore || 0), 0) / (scored.length - half);
      const delta = Math.round(second - first);
      if (delta > 0) out.push(`Your self-rated day scores are trending up (+${delta}).`);
      else if (delta < 0) out.push(`Your self-rated day scores dipped ${delta} recently.`);
    }

    return out;
  })();

  const wentWell: Insight[] = (() => {
    const items: Insight[] = [];
    const m = weekMetrics;
    if (m.prayerPct != null && m.prayerPct >= 80)
      items.push({ tone: "good", text: `Faith held steady — ${m.prayersDone}/${m.prayerRows} prayers logged this week.` });
    if (m.learningDays >= 5)
      items.push({ tone: "good", text: `You studied ${m.learningDays} of the last 7 days (${m.learningHours}h total).` });
    if (m.walkPct != null && m.walkPct >= 70)
      items.push({ tone: "good", text: `Walking happened ${m.walkDays} of the last 7 days.` });
    if (m.sleepAvg != null && m.sleepNights >= 4 && m.sleepAvg >= 7)
      items.push({ tone: "good", text: `You averaged ${m.sleepAvg}h of sleep across ${m.sleepNights} logged nights.` });
    if (m.habitPct != null && m.habitPct >= 75)
      items.push({ tone: "good", text: `Routine check-offs landed ${m.habitPct}% of the time.` });
    if (m.reviews >= 5) items.push({ tone: "good", text: `You reviewed ${m.reviews} of the last 7 days — reflection is becoming a habit.` });
    if (m.waterDays >= 5) items.push({ tone: "good", text: `Hydration target hit ${m.waterDays} of the last 7 days.` });
    return items;
  })();

  const struggled: Insight[] = (() => {
    const items: Insight[] = [];
    const m = weekMetrics;
    if (m.prayerPct != null && m.prayerPct < 60)
      items.push({ tone: "bad", text: `Only ${m.prayerPct}% of logged prayers were completed (${m.prayersDone}/${m.prayerRows}).` });
    if (m.learningDays <= 2 && m.daysTracked >= 3)
      items.push({ tone: "bad", text: `Study happened on just ${m.learningDays} of the last 7 days (${m.learningHours}h).` });
    if (m.walkPct != null && m.walkPct <= 30 && m.daysTracked >= 3)
      items.push({ tone: "bad", text: `Walks logged on only ${m.walkDays} of the last 7 days.` });
    if (m.sleepAvg != null && m.sleepNights >= 3 && m.sleepAvg < 6.5)
      items.push({ tone: "bad", text: `Sleep averaged ${m.sleepAvg}h across ${m.sleepNights} nights.` });
    if (m.habitPct != null && m.habitPct < 60)
      items.push({ tone: "bad", text: `Routine follow-through sat at ${m.habitPct}% (${m.habitsDone}/${m.habitsPlanned} checks).` });
    if (m.reviews <= 2 && m.daysTracked >= 4)
      items.push({ tone: "bad", text: `Only ${m.reviews} daily review${m.reviews === 1 ? "" : "s"} written this week.` });
    if (failureReasons.length > 0)
      items.push({
        tone: "bad",
        text: `Most-logged obstacle: "${failureReasons[0].reason}" (${failureReasons[0].count}x).`,
      });
    return items;
  })();

  const nextImprovement = (() => {
    const candidates: Array<{ score: number; advice: string }> = [];
    const m = weekMetrics;
    if (m.prayerPct != null && m.prayerPct < 80)
      candidates.push({ score: 100 - m.prayerPct, advice: "Anchor one prayer to an existing habit so it never gets skipped." });
    if (m.learningDays < 4)
      candidates.push({ score: (4 - m.learningDays) * 20, advice: "Put one 45-minute study block on tomorrow's calendar — morning, before anything else." });
    if (m.walkPct != null && m.walkPct < 60)
      candidates.push({ score: 100 - m.walkPct, advice: "A 10-minute walk after lunch counts. Start there tomorrow." });
    if (m.sleepAvg != null && m.sleepNights >= 3 && m.sleepAvg < 7)
      candidates.push({ score: (7 - m.sleepAvg) * 25, advice: "Move tonight's shutdown 30 minutes earlier. Sleep lifts every other number here." });
    if (m.habitPct != null && m.habitPct < 70)
      candidates.push({ score: 100 - m.habitPct, advice: "Shrink your weakest habit until it's impossible to fail, then build back up." });
    if (m.reviews <= 3)
      candidates.push({ score: (4 - m.reviews) * 18, advice: "Tonight, write a two-line review: one win, one fix." });
    if (candidates.length === 0) {
      return weekMetrics.daysTracked === 0
        ? "Start by logging today: mark your prayers and one short study session. Insights will build from real entries."
        : "This week looks balanced across the board. Keep the streak alive and revisit tomorrow.";
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].advice;
  })();

  const hasAnyData = weekMetrics.daysTracked > 0;

  const tooltipStyle = {
    backgroundColor: "#FFFFFF",
    border: `1px solid ${GRID}`,
    borderRadius: "8px",
    color: "#1C1C1A",
    fontSize: "12px",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Insights</h1>
          <p className="text-sm text-muted mt-1">Answers built only from what you actually logged.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">{error}</div>
        )}

        {loading ? (
          <Card>
            <CardContent className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-full animate-pulse rounded bg-surface2" />
              ))}
            </CardContent>
          </Card>
        ) : !hasAnyData ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm font-medium text-ink">Not enough data yet.</p>
              <p className="mt-1 text-sm text-muted">
                Log a few days of activity — prayers, study sessions, walks — and this page will start answering questions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* A · THIS WEEK */}
            <section aria-labelledby="week-heading">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" aria-hidden="true" />
                    <span id="week-heading">This week</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
                  <WeekStat icon={Clock} tint="accent" label="Learning" value={`${weekMetrics.learningHours}h`} sub={`${weekMetrics.learningDays}/7 days active`} />
                  {weekMetrics.prayerPct != null && (
                    <WeekStat icon={MoonStar} tint="faith" label="Faith" value={`${weekMetrics.prayersDone}/${weekMetrics.prayerRows}`} sub="prayers logged complete" />
                  )}
                  <WeekStat icon={HeartPulse} tint="success" label="Health" value={`${weekMetrics.walkDays}/7`} sub={weekMetrics.sleepAvg != null ? `walks · ${weekMetrics.sleepAvg}h avg sleep` : "walk days"} />
                  {(weekMetrics.habitPct != null || weekMetrics.reviews > 0) && (
                    <WeekStat
                      icon={ListChecks}
                      tint="warning"
                      label="Routine"
                      value={weekMetrics.habitPct != null ? `${weekMetrics.habitPct}%` : "—"}
                      sub={weekMetrics.reviews > 0 ? `habits · ${weekMetrics.reviews}/7 reviews` : "habit checks"}
                    />
                  )}
                  {summary && (
                    <WeekStat icon={Target} tint="accent" label="Focus quality" value={`${Math.round(summary.avgDiscipline)}%`} sub="avg discipline score" />
                  )}
                </CardContent>
              </Card>
            </section>

            {/* B + C · Went well / Struggled */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InsightList
                title="What went well"
                icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
                items={wentWell}
                emptyText="Nothing crossed the “went well” bar this week — that's information too."
              />
              <InsightList
                title="Where I struggled"
                icon={<CircleAlert className="h-4 w-4 text-warning" aria-hidden="true" />}
                items={struggled}
                emptyText="No weak spots below the line this week. Well held."
              />
            </div>

            {/* D · PATTERNS */}
            {patterns.length > 0 && (
              <section aria-labelledby="patterns-heading">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
                      <span id="patterns-heading">Patterns</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {patterns.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-faint">Patterns appear only when there are enough logged days to trust them.</p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* E · NEXT IMPROVEMENT */}
            <section aria-labelledby="next-heading">
              <Card className="border-accent/40 bg-accent-tint/40">
                <CardContent className="flex items-start gap-3 p-5">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">One improvement for tomorrow</p>
                    <p className="mt-1.5 text-sm font-medium text-ink">{nextImprovement}</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Study hours by day</CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyHours.length === 0 ? (
                    <EmptyChart text="No learning sessions logged yet." />
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyHours}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                          <XAxis dataKey="day" stroke={AXIS} fontSize={12} tickLine={false} />
                          <YAxis stroke={AXIS} fontSize={12} tickLine={false} width={28} />
                          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(91,108,143,0.08)" }} />
                          <Bar dataKey="hours" fill={CHART.slate} radius={[4, 4, 0, 0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {disciplineTrend.length > 1 &&
                      disciplineTrend[disciplineTrend.length - 1].score >= disciplineTrend[0].score ? (
                        <TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-warning" aria-hidden="true" />
                      )}
                    Score trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {disciplineTrend.length === 0 ? (
                    <EmptyChart text="Complete daily reviews to build this trend." />
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={disciplineTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                          <XAxis dataKey="day" stroke={AXIS} fontSize={12} tickLine={false} />
                          <YAxis stroke={AXIS} fontSize={12} tickLine={false} width={28} domain={[0, 100]} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Line type="monotone" dataKey="score" stroke={CHART.slate} strokeWidth={2} dot={{ fill: CHART.slate, r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Study time by skill</CardTitle>
                </CardHeader>
                <CardContent>
                  {skillDistribution.length === 0 ? (
                    <EmptyChart text="No skill hours recorded yet." />
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <PieChart width={220} height={180}>
                          <Pie data={skillDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                            {skillDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {skillDistribution.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-muted">
                              {item.name} ({item.value}h)
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Logged obstacles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {failureReasons.length === 0 ? (
                    <EmptyChart text="No failures logged — keep it up." />
                  ) : (
                    failureReasons.map((item) => (
                      <div key={item.reason} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted">{item.reason}</span>
                          <span className="text-muted">{item.count}×</span>
                        </div>
                        <Progress
                          value={(item.count / Math.max(...failureReasons.map((f) => f.count))) * 100}
                          variant="destructive"
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skill progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Skill progress</CardTitle>
              </CardHeader>
              <CardContent>
                {skillProgress.length === 0 ? (
                  <p className="py-4 text-center text-sm text-faint">No skills configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {skillProgress.map((skill) => (
                      <div key={skill.name} className="grid grid-cols-[minmax(88px,auto)_1fr_auto] items-center gap-3 sm:gap-4">
                        <div className="truncate text-sm text-ink">{skill.name}</div>
                        <Progress value={skill.progress} />
                        <div className="whitespace-nowrap text-right text-xs text-muted">
                          {skill.progress}%{skill.hours > 0 && ` · ${skill.hours}h`}
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

function EmptyChart({ text }: { text: string }) {
  return <p className="py-14 text-center text-sm text-faint">{text}</p>;
}

function WeekStat({
  icon: Icon,
  tint,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: "accent" | "faith" | "success" | "warning";
  label: string;
  value: string;
  sub: string;
}) {
  const tintCls =
    tint === "faith"
      ? "bg-faith-tint text-faith"
      : tint === "success"
      ? "bg-success-tint text-success"
      : tint === "warning"
      ? "bg-warning-tint text-warning"
      : "bg-accent-tint text-accent";
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tintCls}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
        <p className="text-lg font-bold leading-tight text-ink">{value}</p>
        <p className="truncate text-[11px] text-muted">{sub}</p>
      </div>
    </div>
  );
}

function InsightList({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: Insight[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted">{emptyText}</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${it.tone === "good" ? "bg-success" : "bg-warning"}`}
                  aria-hidden="true"
                />
                <span className="text-ink">{it.text}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
