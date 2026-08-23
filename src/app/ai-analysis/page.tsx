"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, Clock } from "lucide-react";
import { useState } from "react";

interface Analysis {
  summary: {
    disciplineScore: number;
    learningHours: number;
    tasksCompleted: number;
    tasksMissed: number;
  };
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  recommendations: string[];
}

export default function AIAnalysisPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const generateAnalysis = async () => {
    setLoading(true);
    setTimeout(() => {
      setAnalysis({
        summary: {
          disciplineScore: 73,
          learningHours: 49.1,
          tasksCompleted: 34,
          tasksMissed: 12,
        },
        strengths: [
          "Morning routine consistency is strong at 85%",
          "Prayer completion rate improved to 90%",
          "Walking habit maintained 6 out of 7 days",
        ],
        weaknesses: [
          "Evening learning sessions missed 5 times this week",
          "Workout skipped on 2 consecutive days",
          "Phone distraction peaked during afternoon hours",
        ],
        patterns: [
          "Your completion rate drops significantly after 3 PM",
          "Weekend discipline is 25% lower than weekdays",
          "Tasks assigned to morning have 2x higher completion rate",
        ],
        recommendations: [
          "Move difficult learning tasks to morning (before noon)",
          "Set phone to Do Not Disturb from 2-5 PM",
          "Schedule workouts right after Fajr when energy is highest",
          "Consider lighter schedule on weekends to maintain consistency",
        ],
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Personal Analyst</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Analyze your patterns and get actionable recommendations
            </p>
          </div>
          <Button onClick={generateAnalysis} disabled={loading}>
            <Brain className="h-4 w-4 mr-2" />
            {loading ? "Analyzing..." : "Generate Analysis"}
          </Button>
        </div>

        {!analysis && !loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-400">No Analysis Yet</h3>
              <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto">
                Click &quot;Generate Analysis&quot; to analyze your weekly patterns,
                identify strengths and weaknesses, and get personalized recommendations.
              </p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full mx-auto mb-4" />
              <p className="text-sm text-zinc-400">Analyzing your data...</p>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Discipline Score</p>
                  <p className="text-2xl font-bold text-white mt-1">{analysis.summary.disciplineScore}%</p>
                  <Badge variant="secondary" className="mt-2">This Week</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Learning Hours</p>
                  <p className="text-2xl font-bold text-white mt-1">{analysis.summary.learningHours}h</p>
                  <Badge variant="secondary" className="mt-2">Target: 56h</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Tasks Completed</p>
                  <p className="text-2xl font-bold text-white mt-1">{analysis.summary.tasksCompleted}</p>
                  <Badge variant="success" className="mt-2">81% rate</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Tasks Missed</p>
                  <p className="text-2xl font-bold text-white mt-1">{analysis.summary.tasksMissed}</p>
                  <Badge variant="destructive" className="mt-2">Needs attention</Badge>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    What You&apos;re Doing Well
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-zinc-300">{s}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Areas Needing Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <TrendingDown className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-zinc-300">{w}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    Patterns Detected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.patterns.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-4 w-4 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] text-blue-400 font-bold">{i + 1}</span>
                      </div>
                      <span className="text-sm text-zinc-300">{p}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ArrowRight className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-zinc-300">{r}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
