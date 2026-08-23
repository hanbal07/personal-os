"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, BookOpen, Code, Database, Globe, Brain, Cpu, ArrowRight, Clock, CheckCircle2, Circle, Lock } from "lucide-react";

interface SkillCard {
  name: string;
  slug: string;
  icon: React.ReactNode;
  phase: string;
  level: string;
  progress: number;
  topicsCompleted: number;
  topicsTotal: number;
  practiceHours: number;
  lastStudied: string;
  currentTopic: string;
  nextTopic: string;
  color: string;
}

const skills: SkillCard[] = [
  {
    name: "Python",
    slug: "python",
    icon: <Code className="h-5 w-5" />,
    phase: "Fundamentals",
    level: "Beginner",
    progress: 35,
    topicsCompleted: 7,
    topicsTotal: 20,
    practiceHours: 12,
    lastStudied: "Today",
    currentTopic: "Functions",
    nextTopic: "Data Structures",
    color: "bg-yellow-900/50 text-yellow-400",
  },
  {
    name: "Git/GitHub",
    slug: "git",
    icon: <Globe className="h-5 w-5" />,
    phase: "Fundamentals",
    level: "Beginner",
    progress: 20,
    topicsCompleted: 3,
    topicsTotal: 15,
    practiceHours: 4,
    lastStudied: "Yesterday",
    currentTopic: "Commits & Branches",
    nextTopic: "Merge & PRs",
    color: "bg-orange-900/50 text-orange-400",
  },
  {
    name: "Data Science",
    slug: "data-science",
    icon: <Database className="h-5 w-5" />,
    phase: "Fundamentals",
    level: "Not Started",
    progress: 0,
    topicsCompleted: 0,
    topicsTotal: 18,
    practiceHours: 0,
    lastStudied: "-",
    currentTopic: "-",
    nextTopic: "NumPy Basics",
    color: "bg-blue-900/50 text-blue-400",
  },
  {
    name: "Web Development",
    slug: "web-dev",
    icon: <Globe className="h-5 w-5" />,
    phase: "Fundamentals",
    level: "Not Started",
    progress: 0,
    topicsCompleted: 0,
    topicsTotal: 25,
    practiceHours: 0,
    lastStudied: "-",
    currentTopic: "-",
    nextTopic: "HTML & CSS Basics",
    color: "bg-purple-900/50 text-purple-400",
  },
  {
    name: "Machine Learning",
    slug: "ml",
    icon: <Brain className="h-5 w-5" />,
    phase: "Fundamentals",
    level: "Not Started",
    progress: 0,
    topicsCompleted: 0,
    topicsTotal: 22,
    practiceHours: 0,
    lastStudied: "-",
    currentTopic: "-",
    nextTopic: "Math Fundamentals",
    color: "bg-pink-900/50 text-pink-400",
  },
  {
    name: "Deep Learning",
    slug: "dl",
    icon: <Cpu className="h-5 w-5" />,
    phase: "Fundamentals",
    level: "Not Started",
    progress: 0,
    topicsCompleted: 0,
    topicsTotal: 20,
    practiceHours: 0,
    lastStudied: "-",
    currentTopic: "-",
    nextTopic: "Neural Network Basics",
    color: "bg-red-900/50 text-red-400",
  },
];

const pythonTopics = [
  { title: "Syntax & Variables", status: "completed" as const },
  { title: "Data Types", status: "completed" as const },
  { title: "Conditions", status: "completed" as const },
  { title: "Loops", status: "completed" as const },
  { title: "Functions", status: "in-progress" as const },
  { title: "Data Structures", status: "not-started" as const },
  { title: "File Handling", status: "not-started" as const },
  { title: "Exceptions", status: "not-started" as const },
  { title: "Modules", status: "not-started" as const },
  { title: "OOP", status: "not-started" as const },
  { title: "Packages", status: "not-started" as const },
  { title: "Virtual Environments", status: "not-started" as const },
  { title: "APIs", status: "not-started" as const },
  { title: "Testing", status: "not-started" as const },
  { title: "Clean Code", status: "not-started" as const },
];

function TopicStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "in-progress":
      return <Clock className="h-4 w-4 text-yellow-400" />;
    default:
      return <Circle className="h-4 w-4 text-zinc-600" />;
  }
}

export default function LearningPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Learning Roadmap</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Fundamentals → Intermediate → Advanced
            </p>
          </div>
          <Button variant="outline" size="sm">
            Today&apos;s Session
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <Card key={skill.slug} className="hover:border-zinc-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${skill.color}`}>
                      {skill.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{skill.name}</CardTitle>
                      <p className="text-xs text-zinc-500">
                        {skill.phase} · {skill.level}
                      </p>
                    </div>
                  </div>
                  <Badge variant={skill.progress > 0 ? "secondary" : "outline"}>
                    {skill.progress}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={skill.progress} />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-zinc-500">Topics</div>
                  <div className="text-zinc-400 text-right">
                    {skill.topicsCompleted}/{skill.topicsTotal}
                  </div>
                  <div className="text-zinc-500">Practice Hours</div>
                  <div className="text-zinc-400 text-right">{skill.practiceHours}h</div>
                  <div className="text-zinc-500">Last Studied</div>
                  <div className="text-zinc-400 text-right">{skill.lastStudied}</div>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Current:</span>
                    <span className="text-zinc-300">{skill.currentTopic}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-zinc-500">Next:</span>
                    <span className="text-yellow-400">{skill.nextTopic}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4 text-yellow-400" />
                Python — Topic Roadmap
              </CardTitle>
              <Badge variant="secondary">7 / 20 completed</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {pythonTopics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-zinc-800/30 transition-colors"
                >
                  <TopicStatusIcon status={topic.status} />
                  <span
                    className={`text-sm ${
                      topic.status === "completed"
                        ? "text-zinc-500"
                        : topic.status === "in-progress"
                        ? "text-white font-medium"
                        : "text-zinc-400"
                    }`}
                  >
                    {i + 1}. {topic.title}
                  </span>
                  {topic.status === "in-progress" && (
                    <Badge variant="warning" className="ml-auto">
                      In Progress
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
