"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Target, CheckCircle2, Circle } from "lucide-react";

const challengeAreas = [
  { name: "Communication", score: 65, habits: ["Explain a technical topic clearly", "Active listening", "Clear documentation"] },
  { name: "Decision Making", score: 70, habits: ["Make independent decisions daily", "Document rationale", "Review past decisions"] },
  { name: "Responsibility", score: 80, habits: ["Complete all tasks", "Own mistakes", "Follow through"] },
  { name: "Problem Solving", score: 60, habits: ["Debug without help first", "Break into smaller parts", "Document solutions"] },
  { name: "Public Speaking", score: 40, habits: ["Record concept explanations", "Present your work", "Practice body language"] },
  { name: "Confidence", score: 55, habits: ["Complete daily challenge", "Speak up", "Celebrate small wins"] },
];

const weeklyChallenges = [
  { title: "Explain Python Functions to Someone", completed: true },
  { title: "Document a Project Professionally", completed: false },
  { title: "Make 3 Independent Decisions", completed: false },
  { title: "Lead a Small Task", completed: false },
];

export default function LeadershipPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leadership & Confidence</h1>
          <p className="text-sm text-zinc-500 mt-1">Develop through actions, not just theory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {challengeAreas.map((area) => (
            <Card key={area.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{area.name}</CardTitle>
                  <Badge variant="secondary">{area.score}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={area.score} />
                <div className="space-y-2">
                  {area.habits.map((habit, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Circle className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-xs text-zinc-400">{habit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-zinc-500" />
              Weekly Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyChallenges.map((challenge, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-zinc-800/30">
                {challenge.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-600" />
                )}
                <div className="flex-1">
                  <span className={`text-sm ${challenge.completed ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                    {challenge.title}
                  </span>
                </div>
                {!challenge.completed && <Button variant="outline" size="sm">Complete</Button>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
