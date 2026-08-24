"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Circle } from "lucide-react";

const challengeAreas = [
  { name: "Communication", habits: ["Explain a technical topic clearly", "Active listening", "Clear documentation"] },
  { name: "Decision Making", habits: ["Make independent decisions daily", "Document rationale", "Review past decisions"] },
  { name: "Responsibility", habits: ["Complete all tasks", "Own mistakes", "Follow through"] },
  { name: "Problem Solving", habits: ["Debug without help first", "Break into smaller parts", "Document solutions"] },
  { name: "Public Speaking", habits: ["Record concept explanations", "Present your work", "Practice body language"] },
  { name: "Confidence", habits: ["Complete daily challenge", "Speak up", "Celebrate small wins"] },
];

const suggestedChallenges = [
  "Explain Python Functions to Someone",
  "Document a Project Professionally",
  "Make 3 Independent Decisions",
  "Lead a Small Task",
];

export default function LeadershipPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Leadership & Confidence</h1>
          <p className="text-sm text-muted mt-1">Develop through actions, not just theory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {challengeAreas.map((area) => (
            <Card key={area.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{area.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {area.habits.map((habit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Circle className="h-3.5 w-3.5 text-faint flex-shrink-0" />
                    <span className="text-xs text-muted">{habit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-muted" />
              Suggested Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedChallenges.map((challenge, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg">
                <Circle className="h-3.5 w-3.5 text-faint flex-shrink-0" />
                <span className="text-sm text-muted">{challenge}</span>
              </div>
            ))}
            <p className="text-xs text-faint pt-2 border-t border-line mt-3">
              Track completed challenges in your Daily Routine or Daily Review.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}