"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BookOpen, Clock, CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Topic {
  id: string;
  title: string;
  status: string;
}

interface Skill {
  id: string;
  name: string;
  phase: string;
  level: string;
  progress: number;
  topicsCompleted: number;
  topicsTotal: number;
  practiceHours: number;
  lastStudied: string | null;
  currentTopic: string;
  nextTopic: string;
  topics: Topic[];
}

const sessionTypes = [
  { value: "LEARNING", label: "Learning" },
  { value: "PRACTICE", label: "Practice" },
  { value: "BUILDING", label: "Building" },
  { value: "REVIEW", label: "Review" },
  { value: "DOCUMENTATION", label: "Documentation" },
];

const topicIcon = (status: string) => {
  if (status === "COMPLETED") return <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
  if (status === "IN_PROGRESS") return <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0" />;
  return <Circle className="h-4 w-4 text-zinc-600 flex-shrink-0" />;
};

export default function LearningPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showSession, setShowSession] = useState(false);

  const [form, setForm] = useState({ skillId: "", sessionType: "LEARNING", durationMins: "60", topic: "" });
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/skills");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSkills(data.skills || []);
      if (data.skills?.length > 0 && !form.skillId) {
        setForm((f) => ({ ...f, skillId: data.skills[0].id }));
      }
    } catch {
      setError("Failed to load your learning roadmap. Please refresh.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cycleTopic = async (skillId: string, topic: Topic) => {
    const order = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "NOT_STARTED"];
    const next = order[order.indexOf(topic.status)] ?? "IN_PROGRESS";
    setError(null);
    try {
      const res = await fetch(`/api/skills/${skillId}/topics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, status: next }),
      });
      if (!res.ok) throw new Error();
      setSkills((prev) =>
        prev.map((s) =>
          s.id === skillId
            ? {
                ...s,
                topics: s.topics.map((t) => (t.id === topic.id ? { ...t, status: next } : t)),
                topicsCompleted: s.topics.filter(
                  (t) => (t.id === topic.id ? next : t.status) === "COMPLETED"
                ).length,
              }
            : s
        )
      );
      load();
    } catch {
      setError("Could not update topic. Try again.");
    }
  };

  const logSession = async () => {
    if (logging) return;
    const duration = parseInt(form.durationMins);
    if (!form.skillId || !Number.isInteger(duration) || duration < 1 || duration > 1440) {
      setError("Pick a skill and a duration between 1 and 1440 minutes.");
      return;
    }
    setLogging(true);
    setError(null);
    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: form.skillId,
          sessionType: form.sessionType,
          durationMins: duration,
          topic: form.topic.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setShowSession(false);
      setForm((f) => ({ ...f, topic: "" }));
      setLogMsg("Session logged ✓");
      setTimeout(() => setLogMsg(null), 2500);
      load();
    } catch {
      setError("Could not log the session. Check values and try again.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Learning Roadmap</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Fundamentals → Intermediate → Advanced{logMsg ? <span className="ml-2 text-emerald-400">· {logMsg}</span> : null}
            </p>
          </div>
          <Button onClick={() => setShowSession(!showSession)}>
            <BookOpen className="h-4 w-4 mr-2" />
            Log Session
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {showSession && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Log Learning Session</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <Select
                options={skills.map((s) => ({ value: s.id, label: s.name }))}
                value={form.skillId}
                onChange={(e) => setForm({ ...form, skillId: e.target.value })}
              />
              <Select
                options={sessionTypes}
                value={form.sessionType}
                onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
              />
              <Input
                type="number"
                min="1"
                max="1440"
                value={form.durationMins}
                onChange={(e) => setForm({ ...form, durationMins: e.target.value })}
                placeholder="Minutes"
              />
              <Input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="Topic (optional)"
              />
              <Button onClick={logSession} disabled={logging}>
                {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Session"}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card><CardContent className="p-6 text-sm text-zinc-500">Loading your roadmap…</CardContent></Card>
        ) : skills.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              No skills configured yet. Skills and their topic roadmaps are seeded for you — check back after setup.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <Card key={skill.id} className="hover:border-zinc-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
                        {skill.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{skill.name}</CardTitle>
                        <p className="text-xs text-zinc-500">{skill.phase} · {skill.level}</p>
                      </div>
                    </div>
                    <Badge variant={skill.progress > 0 ? "secondary" : "outline"}>{skill.progress}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={skill.progress} />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-zinc-500">Topics</div>
                    <div className="text-zinc-400 text-right">{skill.topicsCompleted}/{skill.topicsTotal}</div>
                    <div className="text-zinc-500">Practice Hours</div>
                    <div className="text-zinc-400 text-right">{skill.practiceHours}h</div>
                    <div className="text-zinc-500">Last Studied</div>
                    <div className="text-zinc-400 text-right">{skill.lastStudied || "-"}</div>
                  </div>
                  {skill.nextTopic !== "-" && (
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Next:</span>
                      <span className="text-yellow-400">{skill.nextTopic}</span>
                    </div>
                  )}
                  <button
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 pt-1"
                    onClick={() => setExpanded(expanded === skill.id ? null : skill.id)}
                  >
                    {expanded === skill.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expanded === skill.id ? "Hide" : "Show"} topics
                  </button>
                  {expanded === skill.id && (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {skill.topics.length === 0 ? (
                        <p className="text-xs text-zinc-600 py-2">No topics defined for this skill yet.</p>
                      ) : (
                        skill.topics.map((topic, i) => (
                          <button
                            key={topic.id}
                            onClick={() => cycleTopic(skill.id, topic)}
                            className="w-full flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-zinc-800/40 transition-colors text-left"
                            title="Click to cycle status"
                          >
                            {topicIcon(topic.status)}
                            <span className={`text-xs ${topic.status === "COMPLETED" ? "text-zinc-500 line-through" : topic.status === "IN_PROGRESS" ? "text-white font-medium" : "text-zinc-400"}`}>
                              {i + 1}. {topic.title}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}