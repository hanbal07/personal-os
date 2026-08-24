"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Clock, Target, AlertTriangle, Zap } from "lucide-react";
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

const PALETTE = ["#eab308", "#f97316", "#3b82f6", "#a855f7", "#ec4899", "#ef4444", "#22c55e"];

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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<Array<{ day: string; hours: number }>>([]);
  const [disciplineTrend, setDisciplineTrend] = useState<Array<{ day: string; score: number }>>([]);
  const [skillDistribution, setSkillDistribution] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [failureReasons, setFailureReasons] = useState<Array<{ reason: string; count: number }>>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [skillProgress, setSkillProgress] = useState<Array<{ name: string; progress: number; hours: number; lastStudied: string | null }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          fetch("/api/analytics?days=7"),
          fetch("/api/skills"),
        ]);
        if (!aRes.ok) throw new Error();
        const a = await aRes.json();

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

        if (sRes.ok) {
          const s = await sRes.json();
          setSkillProgress(
            (s.skills || []).map((sk: { name: string; progress: number; practiceHours: number; lastStudied: string | null }) => ({
              name: sk.name,
              progress: sk.progress,
              hours: sk.practiceHours,
              lastStudied: sk.lastStudied,
            }))
          );
        }
      } catch {
        setError("Failed to load analytics. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasData =
    weeklyHours.length > 0 ||
    disciplineTrend.length > 0 ||
    skillDistribution.length > 0 ||
    failureReasons.length > 0;

  const maxFailure = failureReasons.length > 0 ? Math.max(...failureReasons.map((f) => f.count)) : 1;
  const missedPrayers = summary ? Math.max(0, summary.prayerTotal - summary.prayerCompleted) : 0;

  const tooltipStyle = {
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "8px",
    color: "#fafafa",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Analytics</h1>
          <p className="text-sm text-muted mt-1">
            Track your progress and identify patterns
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="p-6 text-sm text-muted">Crunching your numbers…</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success-tint flex items-center justify-center">
                      <Clock className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Learning ({summary?.totalDays ?? 7}d)</p>
                      <p className="text-xl font-bold text-ink">{summary?.totalLearningHours ?? 0}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent-tint flex items-center justify-center">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Avg Daily Learning</p>
                      <p className="text-xl font-bold text-ink">{summary?.avgDailyLearning ?? 0}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-warning-tint flex items-center justify-center">
                      <Zap className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Discipline Avg</p>
                      <p className="text-xl font-bold text-ink">{summary ? Math.round(summary.avgDiscipline) : 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-error-tint flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-error" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Missed Prayer Logs</p>
                      <p className="text-xl font-bold text-ink">{missedPrayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {!hasData ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted">
                  Not enough data yet. Log a few days of activity and your charts will appear here.
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Daily Productive Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {weeklyHours.length === 0 ? (
                        <p className="py-16 text-center text-sm text-faint">No learning sessions logged yet.</p>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyHours}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                              <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                              <YAxis stroke="#71717a" fontSize={12} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Bar dataKey="hours" fill="#fafafa" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Discipline Score Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {disciplineTrend.length === 0 ? (
                        <p className="py-16 text-center text-sm text-faint">Complete daily reviews to build this trend.</p>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={disciplineTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                              <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                              <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Line type="monotone" dataKey="score" stroke="#fafafa" strokeWidth={2} dot={{ fill: "#fafafa", r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Learning Hours by Skill</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {skillDistribution.length === 0 ? (
                        <p className="py-16 text-center text-sm text-faint">No skill hours recorded yet.</p>
                      ) : (
                        <>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={skillDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                                  {skillDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-4">
                            {skillDistribution.map((item) => (
                              <div key={item.name} className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-muted">{item.name} ({item.value}h)</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Top Failure Reasons</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {failureReasons.length === 0 ? (
                        <p className="py-16 text-center text-sm text-faint">No failures logged yet — keep it up.</p>
                      ) : (
                        failureReasons.map((item) => (
                          <div key={item.reason} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted">{item.reason}</span>
                              <span className="text-muted">{item.count}x</span>
                            </div>
                            <Progress value={(item.count / maxFailure) * 100} variant="destructive" />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted" />
                  Skill Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillProgress.length === 0 ? (
                  <p className="text-sm text-faint py-4 text-center">No skills configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    {skillProgress.map((skill) => (
                      <div key={skill.name} className="flex items-center gap-4">
                        <div className="w-32 text-sm text-ink truncate">{skill.name}</div>
                        <div className="flex-1"><Progress value={skill.progress} /></div>
                        <div className="w-12 text-right text-sm text-muted">{skill.progress}%</div>
                        <div className="w-16 text-right text-xs text-muted">{skill.hours}h</div>
                        <div className="w-20 text-right text-xs text-muted">{skill.lastStudied || "-"}</div>
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