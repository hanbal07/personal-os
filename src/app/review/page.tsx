"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { ClipboardCheck, CheckCircle2, AlertCircle, Lightbulb, Target, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function DailyReviewPage() {
  const [review, setReview] = useState({
    accomplishments: "",
    failures: "",
    reasons: "",
    learned: "",
    distractions: "",
    tomorrowPlan: "",
  });
  const [score, setScore] = useState(0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Review</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Reflect on today. Plan for tomorrow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  What did I accomplish today?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={review.accomplishments}
                  onChange={(e) => setReview({ ...review, accomplishments: e.target.value })}
                  placeholder="List your accomplishments..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  What did I fail to complete? Why?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={review.failures}
                  onChange={(e) => setReview({ ...review, failures: e.target.value })}
                  placeholder="What tasks were missed..."
                  rows={2}
                />
                <Textarea
                  value={review.reasons}
                  onChange={(e) => setReview({ ...review, reasons: e.target.value })}
                  placeholder="Why did these fail? Be honest..."
                  rows={2}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  What did I learn?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={review.learned}
                  onChange={(e) => setReview({ ...review, learned: e.target.value })}
                  placeholder="What did you learn today..."
                  rows={2}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What distracted me?</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={review.distractions}
                  onChange={(e) => setReview({ ...review, distractions: e.target.value })}
                  placeholder="What pulled your focus..."
                  rows={2}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  What will I improve tomorrow?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={review.tomorrowPlan}
                  onChange={(e) => setReview({ ...review, tomorrowPlan: e.target.value })}
                  placeholder="Tomorrow I will..."
                  rows={2}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Day Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <ScoreGauge score={score} size="lg" />
                <div className="w-full space-y-2">
                  {[0, 20, 40, 60, 80, 100].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScore(s)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        score === s
                          ? "bg-white/10 text-white"
                          : "text-zinc-500 hover:bg-zinc-800/50"
                      }`}
                    >
                      {s}% - {s >= 90 ? "Excellent" : s >= 75 ? "Good" : s >= 60 ? "Moderate" : s >= 40 ? "Needs Work" : "Critical"}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg">
              Save Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
