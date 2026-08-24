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
  ChevronDown,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  recommend,
  PHASE_SEQUENCE,
  type Skill,
  type Topic,
} from "@/lib/learning-recommend";

const PHASE_META: Record<string, { label: string; blurb: string }> = {
  FUNDAMENTALS: { label: "Foundation", blurb: "Build unshakeable basics" },
  INTERMEDIATE: { label: "Core", blurb: "Real-world fluency" },
  ADVANCED: { label: "Advanced", blurb: "Depth and edge cases" },
  MASTERY: { label: "Projects", blurb: "Prove it by building" },
};

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
  const [openPhase, setOpenPhase] = useState<string | null>("FUNDAMENTALS");
  const [showSession, setShowSession] = useState(false);
  const [form, setForm] = useState({ skillId: "", sessionType: "LEARNING", durationMins: "60", topic: "" });
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: Skill[] = data.skills || [];
      setSkills(list);
      setError(null);
    } catch {
      setError("Couldn't load your learning roadmap. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rec = useMemo(() => recommend(skills), [skills]);
  const selected = skills.find((s) => s.id === selectedId) ?? rec.focus?.skill ?? skills[0] ?? null;

  const selectSkill = (id: string) => {
    setSelectedId(id);
    const focusForSkill = rec.focus && rec.focus.skill.id === id ? rec.focus.topic.phase || "FUNDAMENTALS" : null;
    setOpenPhase(focusForSkill ?? "FUNDAMENTALS");
  };

  const grouped = useMemo(() => {
    if (!selected) return [];
    const groups = new Map<string, Topic[]>();
    for (const t of [...selected.topics].sort(
      (a, b) =>
        PHASE_SEQUENCE.indexOf(a.phase || "FUNDAMENTALS") -
        PHASE_SEQUENCE.indexOf(b.phase || "FUNDAMENTALS") ||
        (a.order ?? 0) - (b.order ?? 0)
    )) {
      const key = t.phase && PHASE_META[t.phase] ? t.phase : "FUNDAMENTALS";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return PHASE_SEQUENCE.filter((p) => groups.has(p)).map((phase) => ({ phase, topics: groups.get(phase)! }));
  }, [selected]);

  const setStatus = async (skillId: string, topic: Topic, next: string) => {
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
                topicsCompleted: s.topics.filter((t) => (t.id === topic.id ? next : t.status) === "COMPLETED").length,
              }
            : s
        )
      );
      return true;
    } catch {
      setError("Couldn't update the topic. Try again.");
      return false;
    }
  };

  const cycleTopic = (skillId: string, topic: Topic) => {
    const order = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
    const next = order[(order.indexOf(topic.status) + 1) % order.length];
    setStatus(skillId, topic, next);
  };

  const startSessionFor = async (skillId: string, topic: Topic | null) => {
    if (topic && topic.status === "NOT_STARTED") await setStatus(skillId, topic, "IN_PROGRESS");
    setForm((f) => ({
      ...f,
      skillId,
      topic: topic?.title ?? "",
      durationMins: String(topic?.durationMins && topic.durationMins > 0 ? Math.min(120, topic.durationMins) : 60),
    }));
    setShowSession(true);
    document.getElementById("log-session-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const markDone = async (skillId: string, topic: Topic) => {
    const ok = await setStatus(skillId, topic, "COMPLETED");
    if (ok) {
      setLogMsg(`“${topic.title}” completed ✓`);
      setTimeout(() => setLogMsg(null), 2500);
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
          topic: form.topic.trim() || rec.focus?.topic.title || null,
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

  const focus = rec.focus;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Learning</h1>
            <p className="mt-1 text-sm text-muted">
              One focus at a time{logMsg ? <span className="ml-2 font-medium text-success">· {logMsg}</span> : null}
            </p>
          </div>
          <Button onClick={() => startSessionFor(focus?.skill.id ?? skills[0]?.id ?? "", focus?.topic ?? null)}>
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
          <Card id="log-session-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Log learning session</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
              <Select
                aria-label="Skill"
                options={skills.map((s) => ({ value: s.id, label: s.name }))}
                value={form.skillId || skills[0]?.id || ""}
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
                aria-label="Topic"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="Topic"
              />
              <Button onClick={logSession} disabled={logging}>
                {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Session"}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
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
            {/* ── CURRENT FOCUS ── */}
            <section aria-labelledby="focus-heading">
              <Card className="border-accent/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base" id="focus-heading">
                    <Target className="h-4 w-4 text-accent" aria-hidden="true" />
                    Current focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!focus ? (
                    <p className="text-sm text-muted">All topics complete — outstanding. Time to build something of your own.</p>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-faint">{focus.skill.name}</p>
                        <p className="mt-1 truncate text-lg font-semibold text-ink">{focus.topic.title}</p>
                        {focus.topic.description && (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{focus.topic.description}</p>
                        )}
                        <p className="mt-1 flex items-center gap-2 text-xs text-faint">
                          {focus.topic.durationMins != null && focus.topic.durationMins > 0 && (
                            <>
                              <Clock className="h-3 w-3" /> ~{focus.topic.durationMins}m
                            </>
                          )}
                          {focus.skill.lastStudied && <span>· last studied {focus.skill.lastStudied}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={() => startSessionFor(focus.skill.id, focus.topic)}>
                          <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                          Start session
                        </Button>
                        {focus.topic.status !== "COMPLETED" && (
                          <Button size="sm" variant="outline" onClick={() => markDone(focus.skill.id, focus.topic)}>
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* ── NEXT UP (max 3) ── */}
            {rec.nextUp.length > 0 && (
              <section aria-labelledby="nextup-heading">
                <h2 id="nextup-heading" className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Next up
                </h2>
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-line">
                      {rec.nextUp.map(({ skill, topic }) => (
                        <li key={topic.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="pt-0.5">{statusIcon(topic.status)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{topic.title}</p>
                            <p className="truncate text-xs text-faint">
                              {skill.name}
                              {topic.durationMins ? ` · ~${topic.durationMins}m` : ""}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => startSessionFor(skill.id, topic)}>
                            Start <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* ── SKILLS GRID ── */}
            <section aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
                Skills
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((s) => {
                  const unlocked = rec.unlockedBySkill[s.id];
                  const current = rec.currentBySkill[s.id];
                  const blockedBy = rec.blockedBySkill[s.id];
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectSkill(s.id)}
                      aria-current={selected?.id === s.id}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        selected?.id === s.id ? "border-accent/50 bg-accent-tint/40" : "border-line bg-surface hover:border-faint"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-ink">{s.name}</h3>
                        <Badge variant={s.progress >= 100 ? "success" : unlocked ? "accent" : "secondary"}>{s.progress}%</Badge>
                      </div>
                      <Progress value={s.progress} variant={s.progress >= 100 ? "success" : "default"} className="mt-2.5" />
                      <p className="mt-2 truncate text-xs text-muted">
                        {!unlocked ? (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Finish {blockedBy} first
                          </span>
                        ) : current ? (
                          <>
                            Now: {current.title}
                          </>
                        ) : (
                          "Complete"
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── ROADMAP (one skill at a time, collapsible phases) ── */}
            {selected && (
              <section aria-labelledby="roadmap-heading">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                  <h2 id="roadmap-heading" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
                    Roadmap
                  </h2>
                  <nav aria-label="Choose skill roadmap" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {skills.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectSkill(s.id)}
                        aria-current={selected.id === s.id}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected.id === s.id
                            ? "border-accent bg-accent-tint text-accent-strong"
                            : "border-line bg-surface text-muted hover:border-faint hover:text-ink"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="space-y-3">
                  {grouped.map(({ phase, topics }) => {
                    const meta = PHASE_META[phase];
                    const doneCount = topics.filter((t) => t.status === "COMPLETED").length;
                    const isOpen = openPhase === phase;
                    return (
                      <Card key={phase}>
                        <button
                          onClick={() => setOpenPhase(isOpen ? null : phase)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-ink">{meta.label}</span>
                            <span className="block text-xs text-faint">{meta.blurb}</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <Badge variant={doneCount === topics.length ? "success" : "secondary"}>
                              {doneCount}/{topics.length}
                            </Badge>
                            <ChevronDown className={`h-4 w-4 text-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </span>
                        </button>
                        {isOpen && (
                          <CardContent className="border-t border-line pt-1">
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
                        )}
                      </Card>
                    );
                  })}
                </div>
                <p className="px-1 pt-2 text-xs leading-relaxed text-faint">
                  Tap any topic to move it Not Started → In Progress → Completed. Skills unlock as earlier ones are engaged — nothing is hidden forever.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
