"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MoonStar, BookOpen, Feather, BellRing, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface PrayerInfo {
  name: string;
  formatted?: string;
  status?: string;
}

export default function FaithPage() {
  const [nextPrayer, setNextPrayer] = useState<PrayerInfo | null>(null);
  const [remaining, setRemaining] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/prayers");
      if (!res.ok) return;
      const data = await res.json();
      if (data.nextPrayer) {
        setNextPrayer(data.nextPrayer);
        setRemaining(data.nextPrayer.remaining || "");
      }
      if (data.location?.label) setLocationLabel(data.location.label);
    } catch {
      /* hero stays empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const sections = [
    { id: "namaz", label: "Namaz", icon: MoonStar },
    { id: "quran", label: "Quran & Darood", icon: BookOpen },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Hero */}
        <section
          aria-label="Next prayer"
          className="rounded-2xl border border-line bg-surface px-5 py-5 sm:px-7 sm:py-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xs font-medium uppercase tracking-[0.2em] text-faint">Faith</h1>
              <p className="mt-1 text-sm text-muted">
                {loading ? "Loading prayer times…" : locationLabel ? `Times for ${locationLabel}` : "Your worship tracker"}
              </p>
              {nextPrayer && (
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-bold tracking-tight text-ink">{nextPrayer.name}</span>
                  {nextPrayer.formatted && (
                    <span className="text-lg text-muted">{nextPrayer.formatted}</span>
                  )}
                  {remaining && (
                    <Badge variant="outline" className="border-line text-muted">
                      in {remaining}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Link
              href="/faith#namaz"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <BellRing className="mr-2 h-4 w-4" />
              Mark Prayer
            </Link>
          </div>
        </section>

        {/* Section pills */}
        <nav aria-label="Faith sections" className="flex flex-wrap gap-2">
          {sections.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </a>
          ))}
        </nav>

        {/* Namaz */}
        <section id="namaz" aria-labelledby="namaz-heading" className="scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="namaz-heading" className="text-xl font-bold tracking-tight text-ink">
              Namaz
            </h2>
            <Link
              href="/namaz"
              className="-my-2 inline-flex items-center gap-1 rounded px-2 py-2 text-sm font-medium text-accent hover:text-accent-strong"
            >
              Full page <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          <NamazSection />
        </section>

        {/* Quran & Darood */}
        <section id="quran" aria-labelledby="quran-heading" className="scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="quran-heading" className="text-xl font-bold tracking-tight text-ink">
              Quran &amp; Darood-e-Pak
            </h2>
            <Link
              href="/quran"
              className="-my-2 inline-flex items-center gap-1 rounded px-2 py-2 text-sm font-medium text-accent hover:text-accent-strong"
            >
              Full page <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          <QuranSection />
        </section>
      </div>
    </AppShell>
  );
}

function NamazSection() {
  const [prayers, setPrayers] = useState<PrayerInfo[] | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/prayers").then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/prayers/record?date=${new Date().toISOString().split("T")[0]}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([timesData, recordsData]) => {
        const statusByName = new Map<string, string>();
        for (const r of recordsData?.prayers || []) {
          if (r.prayer && r.status) statusByName.set(r.prayer, r.status);
        }
        setPrayers(
          (timesData?.prayers || []).map((p: { name: string; formatted?: string }) => ({
            name: p.name,
            formatted: p.formatted,
            status: statusByName.get(p.name.toUpperCase()) || "pending",
          }))
        );
      })
      .catch(() => setPrayers([]));
  }, []);

  if (!prayers) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {prayers.length === 0 ? (
        <p className="col-span-full text-sm text-muted">
          No prayer times available yet.
        </p>
      ) : (
        prayers.map((p) => {
          const st = p.status as string;
          const done = st === "COMPLETED";
          const missed = st === "MISSED";
          const partial = st === "PARTIAL";
          return (
            <Card
              key={p.name}
              className={
                done
                  ? "border-success/30 bg-success-tint/40"
                  : missed
                  ? "border-error/20 opacity-75"
                  : ""
              }
            >
              <CardContent className="p-3 text-center">
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">{p.formatted}</p>
                <div className="mt-2">
                  {done ? (
                    <Badge variant="success">Done</Badge>
                  ) : partial ? (
                    <Badge variant="warning">Partial</Badge>
                  ) : missed ? (
                    <Badge variant="destructive">Missed</Badge>
                  ) : (
                    <Badge variant="secondary">—</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

function QuranSection() {
  const [summary, setSummary] = useState<{ pages: number; darood: number } | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      fetch(`/api/quran?date=${today}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/darood?date=${today}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([q, d]) => {
      setSummary({
        pages: q?.record?.pagesRead ?? 0,
        darood: d?.record?.count ?? 0,
      });
    });
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-faith" />
            Quran today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!summary ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <>
              <p className="text-2xl font-bold text-ink">
                {summary.pages} <span className="text-sm font-medium text-muted">pages</span>
              </p>
              <p className="mt-1 text-xs text-faint">
                {summary.pages >= 10
                  ? "Daily goal reached ✓"
                  : summary.pages > 0
                  ? `${10 - summary.pages} more to reach the daily goal`
                  : "Not logged yet today"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Feather className="h-4 w-4 text-faith" />
            Darood today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!summary ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <>
              <p className="text-2xl font-bold text-ink">
                {summary.darood} <span className="text-sm font-medium text-muted">recitations</span>
              </p>
              <p className="mt-1 text-xs text-faint">
                {summary.darood >= 33
                  ? "Daily tasbeeh complete ✓"
                  : `${33 - summary.darood} more for a full tasbeeh`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
