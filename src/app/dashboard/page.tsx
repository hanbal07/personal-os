"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  MoonStar,
  BookOpen,
  GraduationCap,
  HeartPulse,
  FolderKanban,
  AlertTriangle,
  Droplets,
  Footprints,
  Feather,
  Sparkles,
  ArrowRight,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  date: string;
  greeting: string;
  summary: { tasksCompleted: number; tasksTotal: number; disciplineScore: number; streak: number };
  prayers: { times: Array<{ name: string; time: string; formatted: string }>; nextPrayer: { name: string; time: string; remaining: string } | null; completed: number; total: number };
  quran: { completed: boolean; pagesRead: number };
  darood: { count: number; target: number };
  meals: { count: number; target: number; records: Array<{ mealType: string; content: string }> };
  health: { walking: { completed: boolean; targetMins: number }; exercise: { completed: number; total: number; targetMins: number }; water: number };
  learning: { hours: number; targetHours: number; sessions: number };
  projects: { active: number; records: Array<{ title: string; phase: string; completion: number }> };
  habits: { completed: number; total: number };
  sleep: { hours: number; target: number; bedTime: string; wakeTime: string };
}

interface SkillFocus {
  skillId: string;
  skill: string;
  topicId: string | null;
  topic: string;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{children}</h2>
  );
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<SkillFocus | null>(null);
  const [timezone, setTimezone] = useState<string>("Asia/Karachi");
  const [clock, setClock] = useState<string>("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Couldn't load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  const pickFocus = (skills: Array<Record<string, unknown>>) => {
    for (const s of skills) {
      const topics = (s.topics as Array<{ id: string; title: string; status: string }>) || [];
      const inProgress = topics.find((t) => t.status === "IN_PROGRESS");
      if (inProgress) {
        setFocus({ skillId: s.id as string, skill: s.name as string, topicId: inProgress.id, topic: inProgress.title });
        return;
      }
    }
    // No in-progress topic anywhere: recommend the first not-started topic of the most-practised skill.
    const sorted = [...skills].sort((a, b) => ((b.practiceHours as number) || 0) - ((a.practiceHours as number) || 0));
    for (const s of sorted) {
      const topics = (s.topics as Array<{ id: string; title: string; status: string }>) || [];
      const next = topics.find((t) => t.status === "NOT_STARTED");
      if (next) {
        setFocus({ skillId: s.id as string, skill: s.name as string, topicId: next.id, topic: next.title });
        return;
      }
    }
  };

  useEffect(() => {
    load();
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.settings?.timezone && setTimezone(d.settings.timezone))
      .catch(() => {});
    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => pickFocus(d?.skills || []))
      .catch(() => {});
  }, [load]);

  // Live clock in the user's timezone.
  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date())
      );
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [timezone]);

  const quickDarood = async () => {
    if (!data || busyAction) return;
    setBusyAction("darood");
    const prev = data.darood.count;
    setData({ ...data, darood: { ...data.darood, count: prev + 33 } });
    try {
      const res = await fetch("/api/darood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: 33 }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setData((d) => (d ? { ...d, darood: { ...d.darood, count: prev } } : d));
    } finally {
      setBusyAction(null);
    }
  };

  const quickWater = async () => {
    if (!data || busyAction) return;
    setBusyAction("water");
    const prev = data.health.water;
    setData({ ...data, health: { ...data.health, water: Math.min(20, prev + 1) } });
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "water", data: { glasses: Math.min(20, prev + 1) } }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setData((d) => (d ? { ...d, health: { ...d.health, water: prev } } : d));
    } finally {
      setBusyAction(null);
    }
  };

  const quickWalk = async () => {
    if (!data || busyAction) return;
    setBusyAction("walk");
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "walking", data: { durationMins: data.health.walking.targetMins ?? 30, completed: true } }),
      });
      if (!res.ok) throw new Error();
      setData({
        ...data,
        health: { ...data.health, walking: { ...data.health.walking, completed: true } },
      });
    } catch {
      /* leave unchanged */
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-5 w-56 animate-pulse rounded bg-surface2" />
          <div className="h-40 animate-pulse rounded-2xl bg-hero/10" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="h-28 animate-pulse rounded-xl" />
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-error" />
            <h3 className="mb-1 text-lg font-medium text-ink">Couldn&apos;t load your dashboard</h3>
            <p className="mb-4 text-sm text-muted">Check your connection, then try again.</p>
            <button onClick={() => window.location.reload()} className={cn(buttonVariants())}>
              Retry
            </button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const { prayers, summary, learning } = data;
  const taskPct =
    summary.tasksTotal > 0 ? Math.round((summary.tasksCompleted / summary.tasksTotal) * 100) : 0;
  const isNewUser =
    summary.streak === 0 &&
    summary.tasksCompleted === 0 &&
    learning.hours === 0 &&
    prayers.completed === 0;

  return (
    <AppShell>
      <div className="space-y-7">
        {/* Greeting + live local context */}
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-faint">
            {clock || "\u00A0"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-[26px]">
            {data.greeting}
          </h1>
        </header>

        {isNewUser && (
          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium text-ink">Welcome! Your journey starts today.</p>
                <p className="mt-1 text-xs text-muted">
                  Open <Link href="/routine" className="text-accent hover:underline">Today</Link>, check off your first
                  task, and your streak will begin building itself.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── NEXT UP hero — the one dark surface on Home ── */}
        <section aria-label="Next up">
          <div className="rounded-2xl bg-hero px-6 py-6 text-paper sm:px-8 sm:py-7">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.25fr_1fr] md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <BellRing className="h-3.5 w-3.5 text-paper/50" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/50">
                    Next up
                  </p>
                </div>
                {prayers.nextPrayer ? (
                  <>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      {prayers.nextPrayer.name}
                    </p>
                    <p className="mt-1 text-sm text-paper/70">
                      {prayers.nextPrayer.time} · in {prayers.nextPrayer.remaining.replace(" remaining", "")}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Link href="/faith#namaz" className={cn(buttonVariants(), "border-0 bg-white/10 text-white hover:bg-white/20")}>
                        Mark Prayer
                      </Link>
                      {focus && (
                        <Link href="/learning" className={cn(buttonVariants({ variant: "secondary" }, ), "bg-accent text-white hover:bg-accent-strong")}>
                          {focus.skill}: continue
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      All {prayers.total} prayers done
                    </p>
                    <p className="mt-1 text-sm text-paper/70">Wrap the day with a short review.</p>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Link href="/review" className={cn(buttonVariants(), "bg-white/10 text-white hover:bg-white/20 border-0")}>
                        Daily Review
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Today's progress */}
              <div className="md:border-l md:border-white/10 md:pl-8">
                <SectionHeading>
                  <span className="text-paper/50">Today&apos;s progress</span>
                </SectionHeading>
                <div className="mt-3 flex items-baseline justify-between text-sm">
                  <span className="text-paper/70">Tasks</span>
                  <span className="font-semibold text-white">
                    {summary.tasksCompleted}/{summary.tasksTotal}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${taskPct}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                    Streak {summary.streak}d
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                    {prayers.completed}/{prayers.total} prayers
                  </span>
                  {focus && (
                    <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white sm:inline-block">
                      Focus: {focus.skill}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Current learning focus ── */}
        {focus && (
          <section aria-label="Current learning focus">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <SectionHeading>Current focus</SectionHeading>
                  <p className="mt-1.5 truncate text-lg font-semibold text-ink">
                    {focus.skill} <span className="text-faint">→</span> {focus.topic}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {learning.hours}h logged today · target {learning.targetHours}h
                  </p>
                </div>
                <Link href="/learning" className={cn(buttonVariants(), "shrink-0")}>
                  Continue Learning <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── Domain summaries ── */}
        <section aria-label="Summary" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            href="/faith"
            icon={MoonStar}
            tint="faith"
            title="Faith"
            rows={[
              { label: "Prayers", value: `${prayers.completed}/${prayers.total}` },
              { label: "Quran", value: data.quran.completed ? "Done" : data.quran.pagesRead > 0 ? `${data.quran.pagesRead} pages` : "Not yet" },
              { label: "Darood", value: `${data.darood.count}/${data.darood.target}` },
            ]}
          />
          <SummaryCard
            href="/health"
            icon={HeartPulse}
            tint="success"
            title="Health"
            rows={[
              { label: "Walk", value: data.health.walking.completed ? "Done" : "Pending" },
              { label: "Water", value: `${data.health.water}/8` },
              { label: "Sleep", value: data.sleep.hours > 0 ? `${data.sleep.hours}h` : "Not logged" },
            ]}
          />
          <SummaryCard
            href="/projects"
            icon={FolderKanban}
            tint="accent"
            title="Projects"
            rows={
              data.projects.active > 0
                ? [
                    { label: "Active", value: String(data.projects.active) },
                    { label: "Current", value: data.projects.records[0]?.title ?? "—" },
                    { label: "Phase", value: titleCase(data.projects.records[0]?.phase) || "—" },
                  ]
                : [{ label: "Active", value: "None yet" }, { label: "Start", value: "Create a project" }]
            }
          />
        </section>

        {/* ── Quick actions (last — tools, not the headline) ── */}
        <section aria-label="Quick actions">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <QuickAction icon={MoonStar} label="Mark Prayer" sub={`${prayers.completed}/${prayers.total} today`} href="/faith#namaz" />
            <QuickAction icon={BookOpen} label="Log Quran" sub={data.quran.completed ? "Done ✓" : `${data.quran.pagesRead} pages`} href="/faith#quran" />
            <QuickAction icon={Feather} label="+33 Darood" sub={`${data.darood.count}/${data.darood.target}`} onClick={quickDarood} disabled={busyAction === "darood"} />
            <QuickAction icon={GraduationCap} label="Start Learning" sub={focus ? focus.topic : "Pick a topic"} href="/learning" />
            <QuickAction icon={Footprints} label="Log Walk" sub={data.health.walking.completed ? "Done ✓" : `${data.health.walking.targetMins ?? 30} min`} onClick={quickWalk} disabled={busyAction === "walk" || data.health.walking.completed} />
            <QuickAction icon={Droplets} label="Water +1" sub={`${data.health.water}/8`} onClick={quickWater} disabled={busyAction === "water"} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function titleCase(s?: string): string {
  if (!s) return "";
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
}

function QuickAction({
  icon: Icon,
  label,
  sub,
  href,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <Icon className="h-[18px] w-[18px]" />
      <span className="text-sm font-medium leading-tight">{label}</span>
      <span className="text-[11px] leading-tight text-faint">{sub}</span>
    </>
  );
  const cls =
    "group flex min-h-[76px] flex-col items-start gap-1 rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-ink shadow-[0_1px_2px_rgba(28,28,28,0.04)] transition-colors hover:border-accent/40 hover:bg-accent-tint/50 disabled:pointer-events-none disabled:opacity-50";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

function SummaryCard({
  href,
  icon: Icon,
  tint,
  title,
  rows,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: "faith" | "accent" | "success";
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  const tintCls =
    tint === "faith"
      ? "bg-faith-tint text-faith"
      : tint === "success"
      ? "bg-success-tint text-success"
      : "bg-accent-tint text-accent";
  return (
    <Card className="transition-colors hover:border-line">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tintCls)}>
              <Icon className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
          </div>
          <Link href={href} className="text-xs font-medium text-accent hover:underline">
            View <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        <dl className="mt-3 space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-muted">{r.label}</dt>
              <dd className="truncate font-medium text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
