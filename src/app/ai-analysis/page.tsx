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
  const [needsMoreData, setNeedsMoreData] = useState(false);
  const [error, setError] = useState("");

  const generateAnalysis = async (period: "week" | "month" = "week") => {
    setLoading(true);
    setError("");
    setNeedsMoreData(false);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (res.status === 400 && json.needsMoreData) {
        setNeedsMoreData(true);
        setAnalysis(null);
      } else if (!res.ok) {
        setError(json.error || "Failed to generate analysis. Please try again.");
      } else if (json.analysis) {
        setAnalysis(json.analysis);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">AI Personal Analyst</h1>
            <p className="text-sm text-muted mt-1">
              Analyze your patterns and get actionable recommendations
            </p>
          </div>
          <Button onClick={() => generateAnalysis("week")} disabled={loading}>
            <Brain className="h-4 w-4 mr-2" />
            {loading ? "Analyzing..." : "Generate Analysis"}
          </Button>
        </div>

        {!analysis && !loading && needsMoreData && (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-12 w-12 text-faint mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted">Not enough data yet</h3>
              <p className="text-sm text-faint mt-2 max-w-md mx-auto">
                Not enough data yet. Continue tracking for several days before
                generating meaningful analysis.
              </p>
            </CardContent>
          </Card>
        )}

        {!analysis && !loading && !needsMoreData && error && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-error/60 mx-auto mb-3" />
              <p className="text-sm text-error">{error}</p>
            </CardContent>
          </Card>
        )}

        {!analysis && !loading && !needsMoreData && !error && (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="h-12 w-12 text-faint mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted">No Analysis Yet</h3>
              <p className="text-sm text-faint mt-2 max-w-md mx-auto">
                Click &quot;Generate Analysis&quot; to analyze your weekly patterns,
                identify strengths and weaknesses, and get personalized recommendations.
              </p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-line border-t-accent rounded-full mx-auto mb-4" />
              <p className="text-sm text-muted">Analyzing your data...</p>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted uppercase tracking-wider">Discipline Score</p>
                  <p className="text-2xl font-bold text-ink mt-1">{analysis.summary.disciplineScore}%</p>
                  <Badge variant="secondary" className="mt-2">This Week</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted uppercase tracking-wider">Learning Hours</p>
                  <p className="text-2xl font-bold text-ink mt-1">{analysis.summary.learningHours}h</p>
                  <Badge variant="secondary" className="mt-2">Target: 56h</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted uppercase tracking-wider">Tasks Completed</p>
                  <p className="text-2xl font-bold text-ink mt-1">{analysis.summary.tasksCompleted}</p>
                  <Badge variant="success" className="mt-2">81% rate</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted uppercase tracking-wider">Tasks Missed</p>
                  <p className="text-2xl font-bold text-ink mt-1">{analysis.summary.tasksMissed}</p>
                  <Badge variant="destructive" className="mt-2">Needs attention</Badge>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    What You&apos;re Doing Well
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <TrendingUp className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-ink">{s}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-error" />
                    Areas Needing Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <TrendingDown className="h-4 w-4 text-error mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-ink">{w}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    Patterns Detected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.patterns.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-4 w-4 rounded-full bg-accent-tint flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] text-accent font-bold">{i + 1}</span>
                      </div>
                      <span className="text-sm text-ink">{p}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-warning" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ArrowRight className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-ink">{r}</span>
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
