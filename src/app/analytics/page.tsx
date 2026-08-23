"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, Zap } from "lucide-react";
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

const weeklyHours = [
  { day: "Mon", hours: 8.5 },
  { day: "Tue", hours: 7.2 },
  { day: "Wed", hours: 9.1 },
  { day: "Thu", hours: 6.8 },
  { day: "Fri", hours: 8.0 },
  { day: "Sat", hours: 5.5 },
  { day: "Sun", hours: 4.0 },
];

const disciplineTrend = [
  { day: "Mon", score: 82 },
  { day: "Tue", score: 75 },
  { day: "Wed", score: 88 },
  { day: "Thu", score: 70 },
  { day: "Fri", score: 78 },
  { day: "Sat", score: 65 },
  { day: "Sun", score: 55 },
];

const skillDistribution = [
  { name: "Python", value: 12, color: "#eab308" },
  { name: "Git", value: 4, color: "#f97316" },
  { name: "Data Science", value: 0, color: "#3b82f6" },
  { name: "Web Dev", value: 0, color: "#a855f7" },
  { name: "ML", value: 0, color: "#ec4899" },
  { name: "DL", value: 0, color: "#ef4444" },
];

const failureReasons = [
  { reason: "Phone Distraction", count: 8 },
  { reason: "Tiredness", count: 5 },
  { reason: "Laziness", count: 4 },
  { reason: "Poor Planning", count: 3 },
  { reason: "Overslept", count: 2 },
];

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track your progress and identify patterns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-900/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">This Week</p>
                  <p className="text-xl font-bold text-white">49.1h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Avg Daily</p>
                  <p className="text-xl font-bold text-white">7.0h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-900/50 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Discipline Avg</p>
                  <p className="text-xl font-bold text-white">73%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-900/50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Missed Tasks</p>
                  <p className="text-xl font-bold text-white">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly Productive Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        color: "#fafafa",
                      }}
                    />
                    <Bar dataKey="hours" fill="#fafafa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Discipline Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={disciplineTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        color: "#fafafa",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#fafafa"
                      strokeWidth={2}
                      dot={{ fill: "#fafafa", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Learning Hours by Skill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {skillDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        color: "#fafafa",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {skillDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-zinc-400">
                      {item.name} ({item.value}h)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Failure Reasons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {failureReasons.map((item) => (
                <div key={item.reason} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{item.reason}</span>
                    <span className="text-zinc-500">{item.count}x</span>
                  </div>
                  <Progress
                    value={(item.count / 8) * 100}
                    variant="destructive"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-zinc-500" />
              Skill Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Python", progress: 35, hours: 12, projects: 1, lastStudied: "Today" },
                { name: "Git/GitHub", progress: 20, hours: 4, projects: 0, lastStudied: "Yesterday" },
                { name: "Data Science", progress: 0, hours: 0, projects: 0, lastStudied: "-" },
                { name: "Web Development", progress: 0, hours: 0, projects: 0, lastStudied: "-" },
                { name: "Machine Learning", progress: 0, hours: 0, projects: 0, lastStudied: "-" },
                { name: "Deep Learning", progress: 0, hours: 0, projects: 0, lastStudied: "-" },
              ].map((skill) => (
                <div key={skill.name} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-zinc-300">{skill.name}</div>
                  <div className="flex-1">
                    <Progress value={skill.progress} />
                  </div>
                  <div className="w-12 text-right text-sm text-zinc-500">
                    {skill.progress}%
                  </div>
                  <div className="w-16 text-right text-xs text-zinc-500">
                    {skill.hours}h
                  </div>
                  <div className="w-16 text-right text-xs text-zinc-500">
                    {skill.projects}p
                  </div>
                  <div className="w-20 text-right text-xs text-zinc-500">
                    {skill.lastStudied}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
