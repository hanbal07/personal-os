"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

interface Topic {
  id: string;
  title: string;
  status: string;
  phase?: string;
  order?: number;
  durationMins?: number | null;
  description?: string | null;
}

interface Skill {
  id: string;
  name: string;
  slug: string;
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

const PHASE_META: Record<string, { label: string; blurb: string }> = {
  FUNDAMENTALS: { label: "Beginner · Foundation", blurb: "Build unshakeable basics" },
  INTERMEDIATE: { label: "Core Skills", blurb: "Real-world fluency" },
  ADVANCED: { label: "Advanced Practice", blurb: "Depth and edge cases" },
  MASTERY: { label: "Projects", blurb: "Prove it by building" },
};
const PHASE_SEQUENCE = ["FUNDAMENTALS", "INTERMEDIATE", "ADVANCED", "MASTERY"];

const sessionTypes = [
  { value: "LEARNING", label: "Learning" },
  { value: "PRACTICE", label: "Practice" },
  { value: "BUILDING", label: "Building" },
  { value: "REVIEW", label: "Review" },
  { value: "DOCUMENTATION", label: "Documentation" },
];

const statusIcon = (status: string) => {
  if (status === "COMPLETED") return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />;
  if (status === "IN_PROGRESS") return <Clock className="h-4 w-4 shrink-0 text-warning" />;
  return <Circle className="h-4 w-4 shrink-0 text-line" />;
};

export default function LearningPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSession, setShowSession] = useState(false);
  const [form, setForm] = useState({ skillId: "", sessionType: "LEARNING", durationMins: "60", topic: "" });
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/skills");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSkills(data.skills || []);
      setSelectedId((cur) => cur ?? data.skills?.[0]?.id ?? null);
      setForm((f) => ({ ...f, skillId: f.skillId || data.skills?.[0]?.id || "" }));
    } catch {
      setError("Couldn't load your learning roadmap. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = skills.find((s) => s.id === selectedId) || skills[0] || null;

  // Current focus: in-progress topic first, else first not-started in sequence.
  const focusTopic = useMemo(() => {
    if (!selected) return null;
    return (
      selected.topics.find((t) => t.status === "IN_PROGRESS") ||
      selected.topics.find((t) => t.status === "NOT_STARTED") ||
      null
    );
  }, [selected]);

  const grouped = useMemo(() => {
    if (!selected) return [];
    const groups = new Map<string, Topic[]>();
    for (const t of selected.topics) {
      const key = t.phase && PHASE_META[t.phase] ? t.phase : "FUNDAMENTALS";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return PHASE_SEQUENCE.filter((p) => groups.has(p)).map((phase) => ({
      phase,
      topics: groups.get(phase)!,
    }));
  }, [selected]);

  const cycleTopic = async (skillId: string, topic: Topic) => {
    const order = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
    const next = order[(order.indexOf(topic.status) + 1) % order.length];
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
    } catch {
      setError("Couldn't update the topic. Try again.");
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
          topic: form.topic.trim() || focusTopic?.title || null,
        }),
      });
      if (!res.ok) throw new Error();
      setShowSession(false);
      setForm((f) => ({ ...f, topic: "", durationMins: "60" }));
      setLogMsg("Session logged ✓");
      setTimeout(() => setLogMsg(null), 2500);
      load();
    } catch {
      setError("Couldn't log the session. Check values and try again.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Learning</h1>
            <p className="mt-1 text-sm text-muted">
              Six tracks · one roadmap each{logMsg ? <span className="ml-2 font-medium text-success">· {logMsg}</span> : null}
            </p>
          </div>
          <Button onClick={() => setShowSession(!showSession)}>
            <BookOpen className="mr-2 h-4 w-4" />
            Log Session
          </Button>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {showSession && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Log Learning Session</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
              <Select
                aria-label="Skill"
                options={skills.map((s) => ({ value: s.id, label: s.name }))}
                value={form.skillId}
                onChange={(e) => setForm({ ...form, skillId: e.target.value })}
              />
              <Select
                aria-label="Session type"
                options={sessionTypes}
                value={form.sessionType}
                onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
              />
              <Input
                type="number"
                min="1"
                max="1440"
                aria-label="Duration in minutes"
                value={form.durationMins}
                onChange={(e) => setForm({ ...form, durationMins: e.target.value })}
                placeholder="Minutes"
              />
              <Input
                aria-label="Topic (optional)"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder={focusTopic ? `Defaults to "${focusTopic.title}"` : "Topic (optional)"}
              />
              <Button onClick={logSession} disabled={logging}>
                {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Session"}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : skills.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted">
              No skills configured yet — they are seeded during setup.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Track selector */}
            <nav aria-label="Skill tracks" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {skills.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  aria-current={selected?.id === s.id}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selected?.id === s.id
                      ? "border-accent bg-accent-tint text-accent-strong"
                      : "border-line bg-surface text-muted hover:border-faint hover:text-ink"
                  }`}
                >
                  {s.name}
                  <span className="ml-2 text-xs opacity-70">{s.progress}%</span>
                </button>
              ))}
            </nav>

            {selected && (
              <>
                {/* Overview card */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-ink">{selected.name}</h2>
                        <p className="mt-0.5 text-sm text-muted">
                          {selected.topicsCompleted}/{selected.topicsTotal} topics · {selected.practiceHours}h practice (30d)
                          {selected.lastStudied ? ` · last studied ${selected.lastStudied}` : ""}
                        </p>
                      </div>
                      <Badge variant={selected.progress >= 100 ? "success" : "accent"} className="text-sm">
                        {selected.progress}% complete
                      </Badge>
                    </div>
                    <Progress value={selected.progress} variant={selected.progress >= 100 ? "success" : "default"} className="mt-3" />
                    {focusTopic && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-surface2 p-4">
                        <Target className="h-5 w-5 shrink-0 text-accent" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Current Focus</p>
                          <p className="mt-0.5 truncate font-medium text-ink">{focusTopic.title}</p>
                          {focusTopic.description && (
                            <p className="truncate text-xs text-faint">{focusTopic.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => cycleTopic(selected.id, focusTopic)}>
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            {focusTopic.status === "NOT_STARTED" ? "Start" : "Mark Done"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Phase-grouped roadmap */}
                <div className="space-y-5">
                  {grouped.map(({ phase, topics }) => {
                    const meta = PHASE_META[phase];
                    const doneCount = topics.filter((t) => t.status === "COMPLETED").length;
                    return (
                      <Card key={phase}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{meta.label}</CardTitle>
                              <p className="text-xs text-faint">{meta.blurb}</p>
                            </div>
                            <Badge variant={doneCount === topics.length ? "success" : "secondary"}>
                              {doneCount}/{topics.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-1">
                          <ul className="divide-y divide-line">
                            {topics.map((topic) => (
                              <li key={topic.id}>
                                <button
                                  onClick={() => cycleTopic(selected.id, topic)}
                                  title={
                                    topic.status === "NOT_STARTED"
                                      ? "Click to start this topic"
                                      : topic.status === "IN_PROGRESS"
                                      ? "Click to mark complete"
                                      : "Click to reset status"
                                  }
                                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface2"
                                >
                                  <span className="pt-0.5">{statusIcon(topic.status)}</span>
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block text-sm ${
                                        topic.status === "COMPLETED"
                                          ? "text-faint line-through"
                                          : topic.status === "IN_PROGRESS"
                                          ? "font-semibold text-ink"
                                          : "text-ink"
                                      }`}
                                    >
                                      {topic.title}
                                    </span>
                                    {topic.description && (
                                      <span className="block truncate text-xs text-faint">{topic.description}</span>
                                    )}
                                  </span>
                                  {topic.durationMins != null && (
                                    <span className="shrink-0 pt-0.5 font-mono text-[11px] tabular-nums text-faint">
                                      {topic.durationMins}m
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <p className="px-1 text-xs leading-relaxed text-faint">
                  Tap any topic to move it Not Started → In Progress → Completed. Nothing is deleted; you can always tap back.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
