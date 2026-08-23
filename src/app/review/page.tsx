"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { ClipboardCheck, CheckCircle2, AlertCircle, Lightbulb, Target, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const todayStr = () => new Date().toISOString().split("T")[0];

interface ReviewData {
  accomplishments: string;
  failures: string;
  reasons: string;
  learned: string;
  distractions: string;
  tomorrowPlan: string;
  dayScore: number | null;
}

const emptyReview: ReviewData = {
  accomplishments: "",
  failures: "",
  reasons: "",
  learned: "",
  distractions: "",
  tomorrowPlan: "",
  dayScore: null,
};

export default function DailyReviewPage() {
  const [review, setReview] = useState<ReviewData>(emptyReview);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/review?date=${todayStr()}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.review) {
          setReview({
            accomplishments: data.review.accomplishments || "",
            failures: data.review.failures || "",
            reasons: data.review.reasons || "",
            learned: data.review.learned || "",
            distractions: data.review.distractions || "",
            tomorrowPlan: data.review.tomorrowPlan || "",
            dayScore: data.review.dayScore ?? null,
          });
        }
      } catch {
        setError("Failed to load today's review. You can still write and save.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr(), ...review }),
      });
      if (!res.ok) throw new Error();
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch {
      setError("Could not save your review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof ReviewData) => (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => setReview((r) => ({ ...r, [field]: e.target.value }));

  const score = review.dayScore ? review.dayScore * 10 : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Review</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Reflect on today. Plan for tomorrow.
            </p>
          </div>
          <Button size="lg" onClick={save} disabled={saving}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {saving ? "Saving…" : savedMsg ? "Saved ✓" : "Save Review"}
            {!saving && !savedMsg && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-sm text-zinc-600">Loading today&apos;s review…</p>
        )}

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
                  onChange={update("accomplishments")}
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
                  onChange={update("failures")}
                  placeholder="What tasks were missed..."
                  rows={2}
                />
                <Textarea
                  value={review.reasons}
                  onChange={update("reasons")}
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
                  onChange={update("learned")}
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
                  onChange={update("distractions")}
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
                  onChange={update("tomorrowPlan")}
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
                <div className="w-full grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                    <button
                      key={s}
                      onClick={() => setReview((r) => ({ ...r, dayScore: s }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        review.dayScore === s
                          ? "bg-white/10 text-white"
                          : "text-zinc-500 hover:bg-zinc-800/50"
                      }`}
                    >
                      {s}/10 - {s >= 9 ? "Excellent" : s >= 7 ? "Good" : s >= 5 ? "Moderate" : s >= 3 ? "Needs Work" : "Critical"}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}